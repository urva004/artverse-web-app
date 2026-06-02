// ═══════════════════════════════════════════════════
// ArtVerse — Dashboard / Analytics Service
// ═══════════════════════════════════════════════════

import { prisma } from "../config/database";

/** Seller analytics overview */
export async function getSellerAnalytics(sellerId: string) {
  const [totalProducts, totalOrders, revenue, recentOrders, topProducts, monthlyRevenue] = await Promise.all([
    prisma.artProduct.count({ where: { sellerId } }),
    prisma.orderItem.count({ where: { product: { sellerId } } }),
    prisma.orderItem.aggregate({ where: { product: { sellerId }, order: { status: { in: ["CONFIRMED", "DELIVERED"] } } }, _sum: { price: true } }),
    prisma.order.findMany({
      where: { items: { some: { product: { sellerId } } }, status: { in: ["CONFIRMED", "DELIVERED"] } },
      take: 5, orderBy: { createdAt: "desc" },
      include: { buyer: { select: { id: true, name: true, avatar: true } }, items: { where: { product: { sellerId } }, include: { product: { select: { title: true, images: true } } } } },
    }),
    prisma.artProduct.findMany({
      where: { sellerId },
      orderBy: { views: "desc" }, take: 5,
      select: { id: true, title: true, price: true, views: true, images: true, _count: { select: { reviews: true, orderItems: true } } },
    }),
    // Monthly revenue (last 6 months)
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', o."createdAt") as month, SUM(oi.price * oi.quantity) as revenue
      FROM "Order" o JOIN "OrderItem" oi ON o.id = oi."orderId"
      JOIN "ArtProduct" ap ON oi."productId" = ap.id
      WHERE ap."sellerId" = ${sellerId} AND o.status IN ('CONFIRMED', 'DELIVERED')
      AND o."createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', o."createdAt")
      ORDER BY month ASC
    `,
  ]);

  return {
    stats: {
      totalProducts,
      totalOrders,
      totalRevenue: revenue._sum.price || 0,
    },
    recentOrders,
    topProducts: topProducts.map(({ _count, ...p }) => ({ ...p, reviewCount: _count.reviews, orderCount: _count.orderItems })),
    monthlyRevenue,
  };
}

/** Admin analytics overview */
export async function getAdminAnalytics() {
  const [totalUsers, totalProducts, totalOrders, totalRevenue, usersByRole, recentUsers, pendingProducts] = await Promise.all([
    prisma.user.count(),
    prisma.artProduct.count(),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: { in: ["CONFIRMED", "DELIVERED"] } }, _sum: { totalAmount: true } }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.user.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, createdAt: true } }),
    prisma.artProduct.findMany({ where: { isApproved: false }, take: 10, orderBy: { createdAt: "desc" }, include: { seller: { select: { id: true, name: true } } } }),
  ]);

  return {
    stats: { totalUsers, totalProducts, totalOrders, totalRevenue: totalRevenue._sum.totalAmount || 0 },
    usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {}),
    recentUsers,
    pendingProducts,
  };
}

/** Admin: toggle user active status */
export async function toggleUserStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
}

/** Admin: approve / reject product */
export async function setProductApproval(productId: string, approved: boolean) {
  return prisma.artProduct.update({ where: { id: productId }, data: { isApproved: approved } });
}

/** Get user's order history */
export async function getOrderHistory(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: userId }, skip, take: limit,
      include: { items: { include: { product: { select: { id: true, title: true, images: true, seller: { select: { name: true } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where: { buyerId: userId } }),
  ]);
  return { data: orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
}
