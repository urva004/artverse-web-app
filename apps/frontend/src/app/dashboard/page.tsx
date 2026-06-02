"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Eye,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatPrice, formatDate } from "@artverse/utils";
import { TextSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["seller-dashboard"],
    queryFn: async () => {
      const r = await api.get("/dashboard/seller");
      return r.data.data;
    },
    enabled:
      isAuthenticated && (user?.role === "SELLER" || user?.role === "ADMIN"),
  });

  if (!isAuthenticated || (user?.role !== "SELLER" && user?.role !== "ADMIN")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="font-display text-xl">Access Denied</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Only sellers can access the dashboard
        </p>
        <Link
          href="/"
          className="rounded-pill bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white"
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6"
            >
              <TextSkeleton width="w-20" />
              <TextSkeleton width="w-32" height="h-8" />
            </div>
          ))}
        </div>
      </div>
    );

  const stats = data?.stats;
  const monthlyData = (data?.monthlyRevenue || []).map((m: any) => ({
    month: new Date(m.month).toLocaleDateString("en-IN", { month: "short" }),
    revenue: Number(m.revenue) / 100,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="font-display text-display-sm">
          Seller <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-[var(--color-muted)]">Welcome back, {user?.name}</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Revenue",
            value: formatPrice(stats?.totalRevenue || 0),
            icon: DollarSign,
            color: "var(--color-teal)",
          },
          {
            label: "Total Artworks",
            value: stats?.totalProducts || 0,
            icon: Package,
            color: "var(--color-accent)",
          },
          {
            label: "Total Orders",
            value: stats?.totalOrders || 0,
            icon: ShoppingBag,
            color: "var(--color-gold)",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-[var(--color-muted)]">
                {stat.label}
              </span>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-input"
                style={{ background: `${stat.color}15` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <TrendingUp size={18} className="text-[var(--color-teal)]" />
            Monthly Revenue
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  stroke="var(--color-muted)"
                />
                <YAxis fontSize={12} stroke="var(--color-muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-accent)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--color-muted)]">
              No revenue data yet
            </p>
          )}
        </div>

          {/* Top Artworks */}
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h3 className="mb-4 font-display text-lg font-bold">Top Artworks</h3>
          <div className="space-y-3">
            {data?.topProducts?.map((p: any) => (
              <Link
                key={p.id}
                href={`/marketplace/${p.id}`}
                className="flex items-center gap-3 rounded-input p-2 transition hover:bg-[var(--color-bg)]"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-input">
                  <SafeImage
                    src={normalizeImageSrc(p.images?.[0])}
                    alt={p.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {formatPrice(p.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {p.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={12} />
                    {p.reviewCount}
                  </span>
                </div>
              </Link>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) && (
              <p className="py-6 text-center text-sm text-[var(--color-muted)]">
                No artworks yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-8 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h3 className="mb-4 font-display text-lg font-bold">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Buyer</th>
                <th className="pb-3 pr-4">Items</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.map((order: any) => (
                <tr
                  key={order.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="py-3 pr-4 font-mono text-xs">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 pr-4">{order.buyer.name}</td>
                  <td className="py-3 pr-4">
                    {order.items.map((i: any) => i.product.title).join(", ")}
                  </td>
                  <td className="py-3 pr-4 text-[var(--color-muted)]">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-pill px-2.5 py-0.5 text-[10px] font-medium ${order.status === "DELIVERED" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-[var(--color-gold)]/10 text-[var(--color-gold)]"}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-[var(--color-muted)]"
                  >
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/artworks"
          className="rounded-pill border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Manage Artworks
        </Link>
        <Link
          href="/marketplace"
          className="rounded-pill border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          View Marketplace
        </Link>
      </div>
    </div>
  );
}
