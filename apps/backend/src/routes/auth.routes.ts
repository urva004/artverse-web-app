// ═══════════════════════════════════════════════════
// ArtVerse — Auth Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  onboardingSchema,
  changePasswordSchema,
} from "@artverse/utils";

import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { validateBody } from "../middleware/validate";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  authController.refresh
);

router.post("/logout", authenticate, authController.logout);

router.get("/me", authenticate, authController.me);

router.post(
  "/onboarding",
  authenticate,
  validateBody(onboardingSchema),
  authController.onboarding
);

router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
