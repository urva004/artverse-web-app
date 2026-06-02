// ═══════════════════════════════════════════════════
// ArtVerse — Review Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";
import { createReviewSchema } from "@artverse/utils";
import * as reviewController from "../controllers/review.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/:productId", reviewController.getReviews);
router.post("/:productId", authenticate, validateBody(createReviewSchema), reviewController.createReview);

export default router;
