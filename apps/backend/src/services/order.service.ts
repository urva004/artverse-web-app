// ═══════════════════════════════════════════════════
// ArtVerse — Order Service
// ═══════════════════════════════════════════════════

import type { CreateOrderInput } from "@artverse/utils";

import { prisma } from "../config/database";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";
import { createRazorpayOrder, verifyRazorpaySignature } from "./payment.service";
import { getIO } from "../config/socket";

/**
 * Create a new order and initiate Razorpay payment
 * Wrapped in a transaction to prevent orphaned data on partial failure.
 */
export async function createOrder(buyerId: string, data: CreateOrderInput) {
  // Fetch all products and validate stock
  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.artProduct.findMany({
    where: { id: { in: productIds }, isApproved: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError("One or more products not found or not approved", 400);
  }

  // Validate stock for each item
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new AppError(`Product ${item.productId} not found`, 400);
    }
    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.title}". Available: ${product.stock}`,
        400
      );
    }
    // Prevent buying your own product
    if (product.sellerId === buyerId) {
      throw new AppError("You cannot buy your own product", 400);
    }
  }

  // Calculate total amount
  const totalAmount = data.items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId);
    return total + (product?.price ?? 0) * item.quantity;
  }, 0);

  // Create Razorpay order first (external call, before DB transaction)
  const razorpayOrder = await createRazorpayOrder(totalAmount);

  // Create database order with items inside a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        buyerId,
        totalAmount,
        razorpayOrderId: razorpayOrder.id,
        items: {
          create: data.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product?.price ?? 0,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return newOrder;
  });

  logger.info(
    `Order created: ${order.id} by buyer ${buyerId}, amount: ₹${totalAmount}`
  );

  return {
    order,
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
  };
}

/**
 * Verify Razorpay payment and confirm order.
 * Uses a transaction to atomically update status + decrement stock,
 * preventing race conditions where concurrent payments could oversell.
 */
export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  // Verify signature
  const isValid = verifyRazorpaySignature(
    data.razorpay_order_id,
    data.razorpay_payment_id,
    data.razorpay_signature
  );

  if (!isValid) {
    throw new AppError("Payment verification failed", 400);
  }

  // Atomically update order status + decrement stock in a transaction
  const { order, stockUpdates } = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { razorpayOrderId: data.razorpay_order_id },
      data: {
        status: "CONFIRMED",
        razorpayPaymentId: data.razorpay_payment_id,
      },
      include: {
        items: true,
      },
    });

    const stockUpdates: Array<{ productId: string, newStock: number }> = [];

    // Reduce stock for each item (atomic within transaction)
    for (const item of updatedOrder.items) {
      const product = await tx.artProduct.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      // Verify stock didn't go negative (race condition guard)
      if (product.stock < 0) {
        throw new AppError(
          `Insufficient stock for product ${item.productId}. Order cannot be completed.`,
          400
        );
      }
      
      stockUpdates.push({ productId: item.productId, newStock: product.stock });
    }

    return { order: updatedOrder, stockUpdates };
  });

  // Emit stock update events via Socket.io outside the transaction
  try {
    const io = getIO();
    for (const update of stockUpdates) {
      io.emit("stock:update", update);
    }
  } catch (err) {
    logger.error("Failed to emit stock updates:", err);
  }

  logger.info(`Payment verified for order: ${order.id}`);

  return order;
}

/**
 * Get buyer's order history
 */
export async function getMyOrders(
  buyerId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
                price: true,
                seller: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where: { buyerId } }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get a single order by ID
 */
export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              seller: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.buyerId !== userId) {
    // Check if user is a seller of any item in the order
    const isSellerOfItem = order.items.some(
      (item) => item.product.sellerId === userId
    );
    if (!isSellerOfItem) {
      throw new AppError("You do not have access to this order", 403);
    }
  }

  return order;
}
