// ═══════════════════════════════════════════════════
// ArtVerse — Cloudinary Configuration
// ═══════════════════════════════════════════════════

import fs from "fs";
import path from "path";
import crypto from "crypto";

import { v2 as cloudinary } from "cloudinary";

import { env } from "./index";
import { logger } from "./logger";

const isCloudinaryConfigured =
  !!env.CLOUDINARY_CLOUD_NAME &&
  !!env.CLOUDINARY_API_KEY &&
  !!env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  logger.info("☁️  Cloudinary configured");
} else {
  logger.warn(
    "⚠️  Cloudinary credentials not set — using local file storage for uploads (dev mode)"
  );
}

// ── Local upload directory (dev fallback) ──
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

function ensureUploadDir(): void {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Upload a file buffer to Cloudinary, or save locally in dev mode
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = "artverse"
): Promise<{ url: string; publicId: string }> {
  // ── Dev fallback: save to local filesystem ──
  if (!isCloudinaryConfigured) {
    ensureUploadDir();

    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}-${hash}.webp`;
    const filepath = path.join(LOCAL_UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, fileBuffer);

    const url = `http://localhost:${env.PORT}/uploads/${filename}`;
    logger.info(`📁 Local upload: ${filename}`);

    return { url, publicId: `local/${filename}` };
  }

  // ── Production: upload to Cloudinary ──
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "webp" },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error:", error);
            reject(new Error("Failed to upload image"));
            return;
          }
          if (!result) {
            reject(new Error("No result from Cloudinary"));
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      )
      .end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // If it's a local file, delete from filesystem
  if (publicId.startsWith("local/")) {
    const filename = publicId.replace("local/", "");
    const filepath = path.join(LOCAL_UPLOAD_DIR, filename);
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info(`Deleted local file: ${filename}`);
      }
    } catch (error) {
      logger.error(`Failed to delete local file ${filename}:`, error);
    }
    return;
  }

  // Cloudinary delete
  if (!isCloudinaryConfigured) return;

  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted image: ${publicId}`);
  } catch (error) {
    logger.error(`Failed to delete image ${publicId}:`, error);
  }
}

/**
 * Derive a public ID from a stored asset URL.
 */
export function getPublicIdFromAssetUrl(assetUrl: string): string | null {
  try {
    if (assetUrl.includes("/uploads/")) {
      const filename = assetUrl.split("/uploads/").pop();
      return filename ? `local/${filename}` : null;
    }

    const parsed = new URL(assetUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    const publicSegments = segments
      .slice(uploadIndex + 1)
      .filter((segment) => !/^v\d+$/.test(segment));

    if (publicSegments.length === 0) {
      return null;
    }

    return publicSegments.join("/").replace(/\.[^.]+$/, "") || null;
  } catch {
    return null;
  }
}

export default cloudinary;
