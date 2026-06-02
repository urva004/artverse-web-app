// ═══════════════════════════════════════════════════
// ArtVerse — Route Aggregator
// ═══════════════════════════════════════════════════

import { Router } from "express";

import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import orderRoutes from "./order.routes";
import userRoutes from "./user.routes";
import reviewRoutes from "./review.routes";
import wishlistRoutes from "./wishlist.routes";
import groupRoutes from "./group.routes";
import notificationRoutes from "./notification.routes";
import dashboardRoutes from "./dashboard.routes";
import cartRoutes from "./cart.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/artworks", productRoutes);
router.use("/orders", orderRoutes);
router.use("/users", userRoutes);
router.use("/reviews", reviewRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/groups", groupRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/cart", cartRoutes);
router.use("/upload", uploadRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
