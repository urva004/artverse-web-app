import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";

export class CartService {
  /**
   * Get user's cart or create an empty one if it doesn't exist
   */
  static async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
                stock: true,
                seller: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  images: true,
                  stock: true,
                  seller: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Add an item to the cart (or increment quantity if it exists)
   */
  static async addItem(userId: string, productId: string, quantity: number) {
    const product = await prisma.artProduct.findUnique({
      where: { id: productId, isApproved: true },
    });

    if (!product) {
      throw new AppError("Product not found or not available", 404);
    }

    // Ensure cart exists
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
    });

    const newQuantity = existingItem
      ? Math.min(existingItem.quantity + quantity, product.stock)
      : Math.min(quantity, product.stock);

    if (newQuantity === 0) {
      throw new AppError("Cannot add 0 quantity", 400);
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        cartId: cart.id,
        productId,
        quantity: newQuantity,
        priceSnapshot: product.price,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            stock: true,
            seller: { select: { name: true } },
          },
        },
      },
    });

    return cartItem;
  }

  /**
   * Update quantity or selection status of a cart item
   */
  static async updateItem(
    userId: string,
    productId: string,
    data: { quantity?: number; selected?: boolean }
  ) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError("Cart not found", 404);

    const product = await prisma.artProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let updateData: any = {};
    if (data.quantity !== undefined) {
      updateData.quantity = Math.min(data.quantity, product.stock);
      if (updateData.quantity <= 0) {
        return await this.removeItem(userId, productId);
      }
    }
    if (data.selected !== undefined) {
      updateData.selected = data.selected;
    }

    const cartItem = await prisma.cartItem.update({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            stock: true,
            seller: { select: { name: true } },
          },
        },
      },
    });

    return cartItem;
  }

  /**
   * Remove an item from the cart
   */
  static async removeItem(userId: string, productId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });
  }

  /**
   * Clear all items in the user's cart
   */
  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  /**
   * Merge guest cart items into the authenticated user's cart
   */
  static async syncGuestCart(
    userId: string,
    items: Array<{ productId: string; quantity: number }>
  ) {
    if (!items || items.length === 0) return await this.getCart(userId);

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Validate products exist and are approved
    const productIds = items.map((i) => i.productId);
    const products = await prisma.artProduct.findMany({
      where: {
        id: { in: productIds },
        isApproved: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Fetch existing cart items to properly increment quantities
    const existingItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });
    const existingItemMap = new Map(existingItems.map((i) => [i.productId, i]));

    const upsertPromises = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return Promise.resolve(); // Skip invalid products

      const existing = existingItemMap.get(item.productId);
      const newQuantity = existing
        ? Math.min(existing.quantity + item.quantity, product.stock)
        : Math.min(item.quantity, product.stock);

      if (newQuantity <= 0) return Promise.resolve();

      return prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId: item.productId },
        },
        update: {
          quantity: newQuantity,
        },
        create: {
          cartId: cart.id,
          productId: item.productId,
          quantity: newQuantity,
          priceSnapshot: product.price,
        },
      });
    });

    await Promise.all(upsertPromises);

    return await this.getCart(userId);
  }

  /**
   * Move item between cart and 'Saved for later'
   */
  static async toggleSaveForLater(userId: string, productId: string, save: boolean) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError("Cart not found", 404);

    const cartItem = await prisma.cartItem.update({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      data: {
        isSavedForLater: save,
        // When moving back to cart, we might want to reset 'selected' to true
        selected: save ? false : true,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            stock: true,
            seller: { select: { name: true } },
          },
        },
      },
    });

    return cartItem;
  }
}
