"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  Shield,
  ShieldOff,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@artverse/utils";
import { TextSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";
import { useAuthStore } from "@/store/authStore";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const r = await api.get("/dashboard/admin");
      return r.data.data;
    },
    enabled: isAuthenticated && user?.role === "ADMIN",
  });

  const toggleUser = useMutation({
    mutationFn: (id: string) => api.put(`/dashboard/admin/users/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("User status updated");
    },
  });

  const approveProduct = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.put(`/dashboard/admin/artworks/${id}/approve`, { approved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Product updated");
    },
  });

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="font-display text-xl">Admin Access Required</h2>
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
        <div className="grid gap-6 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6"
            >
              <TextSkeleton width="w-20" />
              <TextSkeleton width="w-24" height="h-8" />
            </div>
          ))}
        </div>
      </div>
    );

  const stats = data?.stats;
  const roleData = data?.usersByRole || {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="font-display text-display-sm">
          Admin <span className="gradient-text">Panel</span>
        </h1>
        <p className="text-[var(--color-muted)]">
          Manage users, artworks, and platform analytics
        </p>
      </motion.div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Users",
            value: stats?.totalUsers || 0,
            icon: Users,
            color: "var(--color-accent)",
          },
          {
            label: "Artworks",
            value: stats?.totalProducts || 0,
            icon: Package,
            color: "var(--color-teal)",
          },
          {
            label: "Orders",
            value: stats?.totalOrders || 0,
            icon: ShoppingBag,
            color: "var(--color-gold)",
          },
          {
            label: "Revenue",
            value: formatPrice(stats?.totalRevenue || 0),
            icon: DollarSign,
            color: "var(--color-rose)",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">
                {stat.label}
              </span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded"
                style={{ background: `${stat.color}15` }}
              >
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="font-display text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* User Distribution */}
      <div className="mb-6 flex flex-wrap gap-3">
        {Object.entries(roleData).map(([role, count]) => (
          <span
            key={role}
            className="rounded-pill border border-[var(--color-border)] px-4 py-1.5 text-xs font-medium"
          >
            {role}: <strong>{String(count)}</strong>
          </span>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h3 className="mb-4 font-display text-lg font-bold">Recent Users</h3>
          <div className="space-y-2">
            {data?.recentUsers?.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-input p-2 transition hover:bg-[var(--color-bg)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs font-bold text-[var(--color-accent)]">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">
                      {u.email} · {u.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleUser.mutate(u.id)}
                  className={`flex h-7 w-7 items-center justify-center rounded text-xs ${u.isActive ? "text-[var(--color-teal)] hover:text-[var(--color-rose)]" : "text-[var(--color-rose)] hover:text-[var(--color-teal)]"}`}
                >
                  {u.isActive ? <Shield size={14} /> : <ShieldOff size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h3 className="mb-4 font-display text-lg font-bold">
            Pending Approvals
          </h3>
          {data?.pendingProducts?.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              No pending artworks 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {data?.pendingProducts?.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-input p-2 transition hover:bg-[var(--color-bg)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                      <SafeImage
                        src={normalizeImageSrc(p.images?.[0])}
                        alt={p.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">
                        {formatPrice(p.price)} · {p.seller.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        approveProduct.mutate({ id: p.id, approved: true })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-teal)] hover:bg-[var(--color-teal)]/10"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() =>
                        approveProduct.mutate({ id: p.id, approved: false })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-rose)] hover:bg-[var(--color-rose)]/10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
