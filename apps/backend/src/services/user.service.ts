// ═══════════════════════════════════════════════════
// ArtVerse — User / Artist Service
// ═══════════════════════════════════════════════════

import type { UpdateProfileInput } from "@artverse/utils";
import { NotificationType } from "@prisma/client";
import { prisma } from "../config/database";
import { uploadToCloudinary } from "../config/cloudinary";
import { AppError } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";

/** Get user public profile with stats */
export async function getUserProfile(userId: string, viewerId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, role: true,
      avatar: true, bio: true, socialLinks: true, createdAt: true,
      _count: { select: { followers: true, following: true, products: true } },
    },
  });
  if (!user) throw new AppError("User not found", 404);

  let isFollowing = false;
  if (viewerId && viewerId !== userId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    });
    isFollowing = !!follow;
  }

  const { _count, ...rest } = user;
  return { ...rest, followerCount: _count.followers, followingCount: _count.following, productCount: _count.products, isFollowing };
}

/** Update own profile */
export async function updateProfile(userId: string, data: UpdateProfileInput, avatarFile?: Express.Multer.File) {
  let avatarUrl: string | undefined;
  if (avatarFile) {
    const result = await uploadToCloudinary(avatarFile.buffer, "artverse/avatars");
    avatarUrl = result.url;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...data, ...(avatarUrl && { avatar: avatarUrl }) },
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, socialLinks: true, createdAt: true },
  });
  return user;
}

/** Toggle follow/unfollow */
export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) throw new AppError("You cannot follow yourself", 400);

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) throw new AppError("User not found", 404);

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return { followed: false };
  }

  await prisma.follow.create({ data: { followerId, followingId } });

  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { name: true },
  });

  await createNotification(
    followingId,
    NotificationType.NEW_FOLLOWER,
    "New follower",
    `${follower?.name || "Someone"} started following you.`,
    `/artists/${followerId}`
  );

  return { followed: true };
}

/** Get followers list */
export async function getFollowers(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId }, skip, take: limit,
      include: { follower: { select: { id: true, name: true, avatar: true, bio: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  return {
    data: followers.map((f) => f.follower),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}

/** Get following list */
export async function getFollowing(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId }, skip, take: limit,
      include: { following: { select: { id: true, name: true, avatar: true, bio: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return {
    data: following.map((f) => f.following),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}

/** Get all artists (sellers) with follower count */
export async function getArtists(page = 1, limit = 20, search?: string) {
  const skip = (page - 1) * limit;
  const where = {
    role: "SELLER" as const,
    isActive: true,
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
  };

  const [artists, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      select: {
        id: true, name: true, avatar: true, bio: true, role: true, createdAt: true,
        _count: { select: { followers: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: artists.map(({ _count, ...rest }) => ({ ...rest, followerCount: _count.followers, productCount: _count.products })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}

/** Search active users for sharing and personal chat */
export async function searchUsers(page = 1, limit = 20, search?: string, excludeUserId?: string) {
  const skip = (page - 1) * limit;
  const where = {
    isActive: true,
    ...(excludeUserId && { id: { not: excludeUserId } }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}
