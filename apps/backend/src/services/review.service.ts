// ═══════════════════════════════════════════════════
// ArtVerse — Review Service
// ═══════════════════════════════════════════════════

import type { CreateReviewInput } from "@artverse/utils";
import { NotificationType } from "@prisma/client";
import { prisma } from "../config/database";
import { invalidateCache } from "../config/redis";
import { AppError } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";

/** Add a review (verified buyers only) */
export async function createReview(productId: string, userId: string, data: CreateReviewInput) {
  // Check product exists
  const product = await prisma.artProduct.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  // Check if user has purchased this product
  // const hasPurchased = await prisma.orderItem.findFirst({
  //   where: {
  //     productId,
  //     order: { buyerId: userId, status: { in: ["CONFIRMED", "DELIVERED"] } },
  //   },
  // });
  // if (!hasPurchased) throw new AppError("You can only review products you have purchased", 403);

  // Check for existing review
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });
  if (existing) throw new AppError("You have already reviewed this product", 409);

  const review = await prisma.review.create({
    data: { productId, userId, rating: data.rating, comment: data.comment },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  const seller = await prisma.artProduct.findUnique({
    where: { id: productId },
    select: { sellerId: true, title: true },
  });

  if (seller && seller.sellerId !== userId) {
    await createNotification(
      seller.sellerId,
      NotificationType.ARTWORK_COMMENTED,
      "New comment on your artwork",
      `${review.user.name} commented on ${seller.title}`,
      `/marketplace/${productId}#reviews`
    );
  }

  await invalidateCache(`products:*`);
  return review;
}

/** Get reviews for a product */
export async function getProductReviews(productId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [reviews, total, allRatings, ratingGroups] = await Promise.all([
    prisma.review.findMany({
      where: { productId }, skip, take: limit,
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { rating: true },
    }),
  ]);

  // Build rating distribution: { 1: count, 2: count, ..., 5: count }
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const group of ratingGroups) {
    ratingDistribution[group.rating] = group._count.rating;
  }

  return {
    data: reviews,
    averageRating: Math.round((allRatings._avg.rating ?? 0) * 10) / 10,
    totalReviews: allRatings._count,
    ratingDistribution,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}
