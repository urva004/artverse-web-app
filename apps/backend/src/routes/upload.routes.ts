// ═══════════════════════════════════════════════════
// ArtVerse — Upload Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";

import * as uploadController from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";

const router = Router();

router.post("/", authenticate, uploadSingle, uploadController.uploadImage);

export default router;