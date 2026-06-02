// ═══════════════════════════════════════════════════
// ArtVerse — Auth Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/errorHandler";
import * as authService from "../services/auth.service";

/**
 * POST /auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    data: result,
    message: "Registration successful",
  });
});

/**
 * POST /auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    data: result,
    message: "Login successful",
  });
});

/**
 * POST /auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    data: result,
    message: "Token refreshed",
  });
});

/**
 * POST /auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logoutUser(refreshToken);

  res.status(200).json({
    success: true,
    data: null,
    message: "Logged out successfully",
  });
});

/**
 * GET /auth/me
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * POST /auth/onboarding
 */
export const onboarding = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.completeOnboarding(req.user!.userId, req.body);

  res.status(200).json({
    success: true,
    data: { user },
    message: "Onboarding saved",
  });
});

/**
 * POST /auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.userId, req.body);

  res.status(200).json({
    success: true,
    data: null,
    message: "Password updated",
  });
});
