// ═══════════════════════════════════════════════════
// ArtVerse — Wishlist Service
// ═══════════════════════════════════════════════════

import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { NotificationType } from "@prisma/client";
import { createNotification } from "./notification.service";

/** Toggle wishlist (add/remove) */
export async function toggleWishlist(userId: string, productId: string) {
  const foundProduct = await prisma.artProduct.findUnique({ where: { id: productId } });
  if (!foundProduct) throw new AppError("Product not found", 404);

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return { wishlisted: false };
  }

  await prisma.wishlist.create({ data: { userId, productId } });

  const product = await prisma.artProduct.findUnique({
    where: { id: productId },
    select: { sellerId: true, title: true },
  });

  if (product && product.sellerId !== userId) {
    await createNotification(
      product.sellerId,
      NotificationType.ARTWORK_LIKED,
      "Artwork liked",
      `Someone liked your artwork: ${product.title}`,
      `/marketplace/${productId}`
    );
  }

  return { wishlisted: true };
}

/** Get user's wishlist */
export async function getWishlist(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.wishlist.findMany({
      where: { userId }, skip, take: limit,
      include: {
        product: {
          include: {
            seller: { select: { id: true, name: true, avatar: true } },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wishlist.count({ where: { userId } }),
  ]);

  const data = items.map((item) => {
    const ratings = item.product.reviews.map((r) => r.rating);
    const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
    const { reviews: _r, ...product } = item.product;
    return { id: item.id, createdAt: item.createdAt, product: { ...product, averageRating: Math.round(avg * 10) / 10, reviewCount: ratings.length } };
  });

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}
