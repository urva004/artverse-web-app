// ═══════════════════════════════════════════════════
// ArtVerse — Auth Service
// ═══════════════════════════════════════════════════

import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  OnboardingInput,
} from "@artverse/utils";
import { UserRole } from "@artverse/utils";

import { env } from "../config";
import { prisma } from "../config/database";
import { logger } from "../config/logger";
import type { AuthPayload } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

function buildPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  bio: string | null;
  socialLinks: unknown;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    socialLinks: user.socialLinks,
    createdAt: user.createdAt,
  };
}

async function ensureRoleAssignment(userId: string, role: UserRole | string): Promise<UserRole> {
  const roleValue = role as unknown as string;
  const roleAssignment = await prisma.userRoleAssignment.upsert({
    where: { userId },
    create: { userId, role: roleValue as any },
    update: { role: roleValue as any },
  });

  return roleAssignment.role as unknown as UserRole;
}

async function resolveRole(userId: string, fallbackRole: UserRole | string): Promise<UserRole> {
  const roleAssignment = await prisma.userRoleAssignment.findUnique({
    where: { userId },
  });

  if (roleAssignment) {
    return roleAssignment.role as unknown as UserRole;
  }

  return fallbackRole as unknown as UserRole;
}

async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: UserRole.BUYER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        socialLinks: true,
        createdAt: true,
      },
    });

    await tx.userRoleAssignment.create({
      data: {
        userId: createdUser.id,
        role: UserRole.BUYER,
      },
    });

    return createdUser;
  });

  const tokens = await generateTokens({
    userId: user.id,
    email: user.email,
    role: UserRole.BUYER,
  });

  logger.info(`User registered: ${user.email} (${user.role})`);

  return { user: { ...user, role: UserRole.BUYER }, tokens };
}

/**
 * Login an existing user
 */
export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  await revokeAllSessions(user.id);

  const role = await ensureRoleAssignment(user.id, user.role);
  const tokens = await generateTokens({
    userId: user.id,
    email: user.email,
    role,
  });

  logger.info(`User logged in: ${user.email}`);

  return {
    user: buildPublicUser({ ...user, role }),
    tokens,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: {
        include: {
          roleAssignment: true,
        },
      },
    },
  });

  if (!storedToken || storedToken.isRevoked) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });
    throw new AppError("Refresh token expired", 401);
  }

  await revokeAllSessions(storedToken.user.id);

  const role = await resolveRole(storedToken.user.id, storedToken.user.role);

  const tokens = await generateTokens({
    userId: storedToken.user.id,
    email: storedToken.user.email,
    role,
  });

  return { tokens };
}

/**
 * Logout — revoke refresh token
 */
export async function logoutUser(refreshToken: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    select: { userId: true },
  });

  if (!storedToken) {
    return;
  }

  await revokeAllSessions(storedToken.userId);
}

/**
 * Get current user by ID
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      socialLinks: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const role = await ensureRoleAssignment(user.id, user.role);

  return buildPublicUser({ ...user, role });
}

/**
 * Update onboarding choice after login
 */
export async function completeOnboarding(userId: string, data: OnboardingInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      bio: true,
      socialLinks: true,
      createdAt: true,
    },
  });

  await ensureRoleAssignment(userId, data.role);

  return buildPublicUser({ ...user, role: data.role });
}

/**
 * Change user password and revoke all sessions
 */
export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.passwordHash
  );

  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  const newPasswordHash = await bcrypt.hash(
    data.newPassword,
    env.BCRYPT_SALT_ROUNDS
  );

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await tx.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  });
}

/**
 * Generate access + refresh token pair
 */
async function generateTokens(payload: Omit<AuthPayload, "sessionId">) {
  const sessionId = crypto.randomUUID();

  const accessToken = jwt.sign({ ...payload, sessionId } as any, env.JWT_SECRET as any, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as any);

  const refreshToken = jwt.sign({ ...payload, sessionId } as any, env.JWT_REFRESH_SECRET as any, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as any);

  // Store refresh token in DB for revocation support
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      id: sessionId,
      token: refreshToken,
      userId: payload.userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
