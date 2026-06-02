// ═══════════════════════════════════════════════════
// ArtVerse — Product Service
// ═══════════════════════════════════════════════════

import type { Prisma } from "@prisma/client";

import type { CreateProductInput, ProductFilterInput } from "@artverse/utils";
import { UserRole } from "@artverse/utils";

import { prisma } from "../config/database";
import { logger } from "../config/logger";
import { getOrSetCache, invalidateCache } from "../config/redis";
import {
  deleteFromCloudinary,
  getPublicIdFromAssetUrl,
  uploadToCloudinary,
} from "../config/cloudinary";
import { viewLimiter } from "../config/viewLimiter";
import { AppError } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";
import { NotificationType } from "@prisma/client";

/**
 * Create a new product listing
 */
export async function createProduct(
  sellerId: string,
  data: CreateProductInput,
  imageFiles: Express.Multer.File[]
) {
  if (imageFiles.length === 0) {
    throw new AppError("At least one image is required", 400);
  }

  // Upload all images to Cloudinary
  const imageUrls = await Promise.all(
    imageFiles.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, "artverse/products");
      return result.url;
    })
  );

  const product = await prisma.artProduct.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags,
      stock: data.stock,
      images: imageUrls,
      isApproved: true,
      sellerId,
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  const followers = await prisma.follow.findMany({
    where: { followingId: sellerId },
    select: { followerId: true },
  });

  await Promise.all(
    followers.map((follow) =>
      createNotification(
        follow.followerId,
        NotificationType.ARTWORK_UPLOADED,
        "New artwork uploaded",
        `${product.seller.name} uploaded a new artwork: ${product.title}`,
        `/marketplace/${product.id}`
      )
    )
  );

  await invalidateCache("products:*");
  logger.info(`Product created: ${product.id} by seller ${sellerId}`);

  return product;
}

/**
 * Get products with filters, search, and pagination
 */
export async function getProducts(filters: ProductFilterInput) {
  const {
    category,
    minPrice,
    maxPrice,
    minRating,
    search,
    sellerId,
    isApproved = true,
    sortBy = "newest",
    page = 1,
    limit = 20,
  } = filters;

  const cacheKey = `products:${JSON.stringify(filters)}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      const where: Prisma.ArtProductWhereInput = {
        isApproved,
        ...(category && { category }),
        ...(sellerId && { sellerId }),
        ...(minPrice !== undefined || maxPrice !== undefined
          ? {
              price: {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice }),
              },
            }
          : {}),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { hasSome: [search.toLowerCase()] } },
          ],
        }),
      };

      // Handle minRating pre-fetch filter via DB Aggregate
      if (minRating) {
        const aggregations = await prisma.review.groupBy({
          by: ["productId"],
          having: { rating: { _avg: { gte: minRating } } },
        });
        const qualifiedIds = aggregations.map((a) => a.productId);
        where.id = { in: qualifiedIds };
      }

      // Sort mapping
      const orderBy: Prisma.ArtProductOrderByWithRelationInput =
        sortBy === "price_asc"
          ? { price: "asc" }
          : sortBy === "price_desc"
            ? { price: "desc" }
            : sortBy === "popular"
              ? { views: "desc" }
              : { createdAt: "desc" };

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.artProduct.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            reviews: {
              select: { rating: true },
            },
          },
        }),
        prisma.artProduct.count({ where }),
      ]);

      // Compute average rating for each product
      const productsWithRating = products.map((product) => {
        const ratings = product.reviews.map((r) => r.rating);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;

        const { reviews: _reviews, ...rest } = product;
        return {
          ...rest,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: ratings.length,
        };
      });

      return {
        data: productsWithRating,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    },
    300 // 5 minute cache
  );
}

/**
 * Get a single product by ID (with reviews & seller info)
 */
export async function getProductById(productId: string, userId?: string, ip?: string) {
  const product = await prisma.artProduct.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          socialLinks: true,
          createdAt: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Increment view count only if rate limiter allows
  if (ip && viewLimiter.allowView(ip, productId)) {
    await prisma.artProduct.update({
      where: { id: productId },
      data: { views: { increment: 1 } },
    });
  }

  // Check wishlist status if user is authenticated
  let isWishlisted = false;
  if (userId) {
    const wishlistItem = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    isWishlisted = !!wishlistItem;
  }

  const likeCount = await prisma.wishlist.count({
    where: { productId },
  });

  const ratings = product.reviews.map((r) => r.rating);
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

  return {
    ...product,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: ratings.length,
    likeCount,
    isWishlisted,
  };
}

/**
 * Get internal products list strictly for a seller's dashboard management
 */
export async function getProductsBySellerId(sellerId: string) {
  const products = await prisma.artProduct.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: {
      reviews: { select: { rating: true } },
    },
  });

  return products.map((product) => {
    const ratings = product.reviews.map((r) => r.rating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;

    const { reviews: _reviews, ...rest } = product;
    return {
      ...rest,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: ratings.length,
    };
  });
}

/**
 * Update a product (seller only)
 */
export async function updateProduct(
  productId: string,
  sellerId: string,
  data: Partial<CreateProductInput> & { removedImageUrls?: string[] },
  imageFiles?: Express.Multer.File[]
) {
  console.log(`[DEBUG] Updating Product ID: ${productId} by Seller: ${sellerId}`);
  console.log(`[DEBUG] Update Data:`, data);
  const existing = await prisma.artProduct.findUnique({
    where: { id: productId },
  });

  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  if (existing.sellerId !== sellerId) {
    throw new AppError("You can only update your own products", 403);
  }

  let imageUrls = existing.images;

  if (data.removedImageUrls && data.removedImageUrls.length > 0) {
    const removedSet = new Set(data.removedImageUrls);

    await Promise.all(
      existing.images
        .filter((url) => removedSet.has(url))
        .map(async (url) => {
          const publicId = getPublicIdFromAssetUrl(url);
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        })
    );

    imageUrls = imageUrls.filter((url) => !removedSet.has(url));
  }

  if (imageFiles && imageFiles.length > 0) {
    const newUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const result = await uploadToCloudinary(
          file.buffer,
          "artverse/products"
        );
        return result.url;
      })
    );
    imageUrls = [...imageUrls, ...newUrls];
  }

  const product = await prisma.artProduct.update({
    where: { id: productId },
    data: {
      ...data,
      images: imageUrls,
    },
    include: {
      seller: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  await invalidateCache("products:*");
  return product;
}

/**
 * Delete a product (owner or admin)
 */
export async function deleteProduct(
  productId: string,
  userId: string,
  userRole: UserRole
) {
  const product = await prisma.artProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.sellerId !== userId && userRole !== UserRole.ADMIN) {
    throw new AppError("You do not have permission to delete this product", 403);
  }

  for (const imageUrl of product.images) {
    const publicId = getPublicIdFromAssetUrl(imageUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  await prisma.artProduct.delete({ where: { id: productId } });
  await invalidateCache("products:*");

  logger.info(`Product deleted: ${productId} by user ${userId}`);
}

/**
 * Get trending products (top by views + review count)
 */
export async function getTrendingProducts(limit: number = 10) {
  return getOrSetCache(
    `products:trending:${limit}`,
    async () => {
      const products = await prisma.artProduct.findMany({
        where: { isApproved: true },
        orderBy: [{ views: "desc" }, { createdAt: "desc" }],
        take: limit,
        include: {
          seller: {
            select: { id: true, name: true, avatar: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
      });

      return products.map((product) => {
        const ratings = product.reviews.map((r) => r.rating);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;
        const { reviews: _reviews, ...rest } = product;
        return {
          ...rest,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: ratings.length,
        };
      });
    },
    300
  );
}
