// ═══════════════════════════════════════════════════
// ArtVerse — Order Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";

import { createOrderSchema, verifyPaymentSchema } from "@artverse/utils";

import * as orderController from "../controllers/order.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.post(
  "/",
  authenticate,
  validateBody(createOrderSchema),
  orderController.createOrder
);

router.post(
  "/verify",
  authenticate,
  validateBody(verifyPaymentSchema),
  orderController.verifyPayment
);

router.get("/my", authenticate, orderController.getMyOrders);

router.get("/:id", authenticate, orderController.getOrder);

export default router;
