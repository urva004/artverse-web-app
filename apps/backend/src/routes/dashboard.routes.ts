// ═══════════════════════════════════════════════════
// ArtVerse — Dashboard Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "@artverse/utils";

const router = Router();

// Seller dashboard
router.get("/seller", authenticate, authorize(UserRole.SELLER, UserRole.ADMIN), dashboardController.getSellerDashboard);

// Admin dashboard
router.get("/admin", authenticate, authorize(UserRole.ADMIN), dashboardController.getAdminDashboard);
router.put("/admin/users/:id/toggle", authenticate, authorize(UserRole.ADMIN), dashboardController.toggleUserStatus);
router.put("/admin/products/:id/approve", authenticate, authorize(UserRole.ADMIN), dashboardController.approveProduct);
router.put("/admin/artworks/:id/approve", authenticate, authorize(UserRole.ADMIN), dashboardController.approveProduct);

// Order history (any authenticated user)
router.get("/orders", authenticate, dashboardController.getMyOrders);

export default router;
