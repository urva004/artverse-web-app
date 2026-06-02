// ═══════════════════════════════════════════════════
// ArtVerse — User / Artist Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as userService from "../services/user.service";

/** GET /users/artists */
export const getArtists = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const result = await userService.getArtists(page, limit, search);
  res.json({ success: true, ...result });
});

/** GET /users/search */
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const result = await userService.searchUsers(page, limit, search, req.user?.userId);
  res.json({ success: true, ...result });
});

/** GET /users/:id */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.getUserProfile(req.params.id, req.user?.userId);
  res.json({ success: true, data });
});

/** PUT /users/me */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  const data = await userService.updateProfile(req.user!.userId, req.body, file);
  res.json({ success: true, data, message: "Profile updated" });
});

/** POST /users/:id/follow */
export const toggleFollow = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.toggleFollow(req.user!.userId, req.params.id);
  res.json({ success: true, data: result, message: result.followed ? "Followed" : "Unfollowed" });
});

/** GET /users/:id/followers */
export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await userService.getFollowers(req.params.id, page);
  res.json({ success: true, ...result });
});

/** GET /users/:id/following */
export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await userService.getFollowing(req.params.id, page);
  res.json({ success: true, ...result });
});
