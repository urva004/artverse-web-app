"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatPrice, formatDate } from "@artverse/utils";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";

const STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  DELIVERED: Truck,
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--color-gold)",
  CONFIRMED: "var(--color-accent)",
  DELIVERED: "var(--color-teal)",
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", page],
    queryFn: async () => {
      const r = await api.get(`/dashboard/orders?page=${page}`);
      return r.data;
    },
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ProductGridSkeleton count={3} />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="font-display text-display-sm">
          My <span className="gradient-text">Orders</span>
        </h1>
        <p className="text-[var(--color-muted)]">
          {pagination?.total || 0} orders
        </p>
      </motion.div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Package size={32} className="text-[var(--color-muted)]" />
          <h3 className="font-display text-lg font-bold">No orders yet</h3>
          <Link
            href="/marketplace"
            className="rounded-pill bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any, i: number) => {
            const StatusIcon = STATUS_ICONS[order.status] || Clock;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-[var(--color-muted)]">
                      #{order.id.slice(0, 12)}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      size={14}
                      style={{ color: STATUS_COLORS[order.status] }}
                    />
                    <span
                      className="rounded-pill px-3 py-1 text-[10px] font-semibold"
                      style={{
                        background: `${STATUS_COLORS[order.status]}15`,
                        color: STATUS_COLORS[order.status],
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/marketplace/${item.product.id}`}
                      className="flex items-center gap-3 rounded-input p-2 transition hover:bg-[var(--color-bg)]"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-input">
                        <SafeImage
                          src={normalizeImageSrc(item.product.images?.[0])}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.product.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-muted)]">
                          by {item.product.seller?.name} · Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-3 flex justify-end border-t border-[var(--color-border)] pt-3">
                  <span className="text-sm font-bold">
                    Total:{" "}
                    <span className="text-[var(--color-accent)]">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-30"
          >
            Previous
          </button>
          <span className="px-4 text-sm text-[var(--color-muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
