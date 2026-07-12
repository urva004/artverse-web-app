// ═══════════════════════════════════════════════════
// ArtVerse — User / Artist Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { sendMessageSchema, updateProfileSchema } from "@artverse/utils";
import * as userController from "../controllers/user.controller";
import * as directMessageController from "../controllers/direct-message.controller";
import { authenticate, optionalAuth } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";
import { validateBody } from "../middleware/validate";

/**
 * Parse socialLinks from JSON string (sent via FormData)
 */
function preprocessProfileForm(req: Request, _res: Response, next: NextFunction) {
  if (typeof req.body.socialLinks === "string") {
    try {
      req.body.socialLinks = JSON.parse(req.body.socialLinks);
    } catch {
      // leave as-is, validation will catch it
    }
  }
  next();
}

const router = Router();

router.get("/artists", userController.getArtists);
router.get("/search", authenticate, userController.searchUsers);
router.get("/:id", optionalAuth, userController.getProfile);
router.get("/:id/messages", authenticate, directMessageController.getDirectMessages);
router.post("/:id/messages", authenticate, validateBody(sendMessageSchema), directMessageController.sendDirectMessage);
router.patch("/messages/:messageId", authenticate, directMessageController.editDirectMessage);
router.delete("/messages/:messageId", authenticate, directMessageController.deleteDirectMessage);
router.post("/messages/:messageId/react", authenticate, directMessageController.reactToDirectMessage);
router.put("/me", authenticate, uploadAvatar, preprocessProfileForm, validateBody(updateProfileSchema), userController.updateProfile);
router.post("/:id/follow", authenticate, userController.toggleFollow);
router.get("/:id/followers", userController.getFollowers);
router.get("/:id/following", userController.getFollowing);

export default router;
