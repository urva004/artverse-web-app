// ═══════════════════════════════════════════════════
// ArtVerse — Auth Middleware (JWT)
// ═══════════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import type { UserRole } from "@artverse/utils";

import { env } from "../config";
import { prisma } from "../config/database";
import { logger } from "../config/logger";

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

async function resolveAuthenticatedUser(token: string): Promise<AuthPayload | null> {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

  if (!decoded.sessionId) {
    return null;
  }

  const session = await prisma.refreshToken.findUnique({
    where: { id: decoded.sessionId },
    include: {
      user: {
        include: {
          roleAssignment: true,
        },
      },
    },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  const rawRole = session.user.roleAssignment?.role ?? session.user.role;
  const role = rawRole as unknown as UserRole;

  return {
    userId: session.user.id,
    email: session.user.email,
    role,
    sessionId: session.id,
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Verify JWT access token and attach user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please provide a valid token.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Token is missing.",
    });
    return;
  }

  try {
    const resolvedUser = await resolveAuthenticatedUser(token);

    if (!resolvedUser) {
      res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
      return;
    }

    req.user = resolvedUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired. Please refresh your token.",
      });
      return;
    }
    logger.warn("Invalid token attempt:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
}

/**
 * Optional auth — attach user if token exists, but don't block
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const resolvedUser = await resolveAuthenticatedUser(token);
        if (resolvedUser) {
          req.user = resolvedUser;
        }
      } catch {
        // Token invalid, but we don't block — user is simply not authenticated
      }
    }
  }

  next();
}

/**
 * Role-based access control middleware
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
      return;
    }

    next();
  };
}

/**
 * Check if the authenticated user owns the resource (or is admin)
 */
export async function authorizeOwner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  const resourceUserId = req.params.id;

  if (req.user.role === "ADMIN" || req.user.userId === resourceUserId) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: "You can only access your own resources.",
  });
}
