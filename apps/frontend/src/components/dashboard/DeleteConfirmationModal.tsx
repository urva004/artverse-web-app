"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, toastApiError } from "@/lib/api";

interface DeleteConfirmationModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export function DeleteConfirmationModal({ productId, productName, onClose }: DeleteConfirmationModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/artworks/${productId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
      toast.success("Artwork deleted successfully.");
      onClose();
    },
    onError: (err: any) => {
      toastApiError(err, "Failed to delete item.");
    },
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !deleteMutation.isPending) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-2xl"
        style={{ animation: "deleteModalIn 0.25s ease-out" }}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-rose)]/10">
          <AlertTriangle size={28} className="text-[var(--color-rose)]" />
        </div>
        
        <h2 className="mb-2 text-center font-display text-xl font-bold">Delete Artwork?</h2>
        <p className="mb-6 text-center text-sm text-[var(--color-muted)] leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[var(--color-text)]">"{productName}"</span>?
          <br />
          <span className="text-xs">This action cannot be undone.</span>
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-rose)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50 shadow-lg"
          >
            {deleteMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
          </button>
          <button
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-full rounded-full border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm font-semibold transition hover:bg-[var(--color-card)] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes deleteModalIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
