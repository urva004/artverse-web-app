// ═══════════════════════════════════════════════════
// ArtVerse — Upload Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";

import { uploadToCloudinary } from "../config/cloudinary";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../middleware/errorHandler";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    throw new AppError("Image file is required", 400);
  }

  const result = await uploadToCloudinary(file.buffer, "artverse/uploads");

  res.status(201).json({
    success: true,
    message: "Image uploaded",
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});