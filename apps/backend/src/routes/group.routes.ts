// ═══════════════════════════════════════════════════
// ArtVerse — Group Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";
import { createGroupSchema, sendMessageSchema } from "@artverse/utils";
import * as groupController from "../controllers/group.controller";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.get("/", optionalAuth, groupController.getGroups);
router.post("/", authenticate, validateBody(createGroupSchema), groupController.createGroup);
router.get("/:id", optionalAuth, groupController.getGroup);
router.post("/:id/join", authenticate, groupController.joinGroup);
router.post("/:id/leave", authenticate, groupController.leaveGroup);
router.get("/:id/messages", authenticate, groupController.getMessages);
router.post("/:id/messages", authenticate, validateBody(sendMessageSchema), groupController.sendMessage);

export default router;
