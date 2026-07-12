"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Loader2, ImageIcon, DollarSign, Package, Tag, FileText, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { api, toastApiError } from "@/lib/api";
import { ArtCategory, CATEGORY_LABELS } from "@artverse/utils";
import { SafeImage } from "@/components/SafeImage";

interface EditFormValues {
  title: string;
  description: string;
  price: number;
  stock: number;
  category: ArtCategory;
  tags: string; // comma-separated string in the form
}

interface EditProductModalProps {
  product: any;
  onClose: () => void;
}

export function EditProductModal({ product, onClose }: EditProductModalProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>(product.images || []);

  useEffect(() => {
    setCurrentImages(product.images || []);
    setFiles([]);
    setFilePreviews([]);
  }, [product]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditFormValues>({
    defaultValues: {
      title: product.title || "",
      description: product.description || "",
      price: product.price || 0,
      stock: product.stock ?? 1,
      category: product.category || ArtCategory.PAINTINGS,
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : (product.tags || ""),
    },
  });

  const addFiles = (newFiles: FileList | File[]) => {
    const totalImages = currentImages.length + files.length;
    const allowed = Array.from(newFiles)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5 - totalImages);

    if (allowed.length === 0) {
      if (files.length >= 5) toast.error("Maximum 5 images allowed");
      return;
    }

    setFiles((prev) => [...prev, ...allowed]);
    allowed.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === "string" ? reader.result.trim() : "";

        if (!result) {
          return;
        }

        setFilePreviews((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    setCurrentImages((prev) => prev.filter((url) => url !== imageUrl));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const formData = new FormData();

      // Only send changed fields
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("price", String(data.price));
      formData.append("stock", String(data.stock));
      formData.append("category", data.category);

      // Convert comma-separated tags to JSON array
      const tagsArray = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      formData.append("tags", JSON.stringify(tagsArray));

      formData.append(
        "removedImageUrls",
        JSON.stringify(product.images.filter((url: string) => !currentImages.includes(url)))
      );

      // Attach new images if any
      files.forEach((file) => {
        formData.append("images", file);
      });

      const res = await api.put(`/artworks/${product.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      queryClient.invalidateQueries({ queryKey: ["seller-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
      toast.success("Product updated successfully!");
      onClose();
    },
    onError: (err: any) => {
      console.error("[EditProductModal] Update error:", err);
      toastApiError(err, "Failed to update product");
    },
  });

  const onSubmit = (data: EditFormValues) => {
    updateMutation.mutate(data);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !updateMutation.isPending) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl"
        style={{
          animation: "modalSlideIn 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-teal)]/20">
              <Sparkles size={20} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Edit Artwork</h2>
              <p className="text-xs text-[var(--color-muted)]">Update your artwork details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Current Image Preview */}
          {currentImages.length > 0 && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                <ImageIcon size={15} className="text-[var(--color-accent)]" />
                Existing Images
                <span className="text-xs opacity-60">(remove to delete from Cloudinary)</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {currentImages.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="group relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
                  >
                    <SafeImage
                      src={img}
                      alt={`Current ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-rose)] text-white text-xs opacity-0 transition group-hover:opacity-100 shadow-md"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Upload */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
              <Upload size={15} className="text-[var(--color-accent)]" />
              Add New Images
              <span className="text-xs opacity-60">(optional, appended to existing)</span>
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-card)] px-4 py-2.5 text-sm font-semibold border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] transition">
                <Upload size={16} className="text-[var(--color-accent)]" />
                Choose Files
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                  }}
                />
              </label>
              {files.length > 0 && (
                <span className="text-xs text-[var(--color-muted)]">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </span>
              )}
            </div>
            {filePreviews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {filePreviews.map((src, i) => (
                  <div
                    key={i}
                    className="group relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-card)]"
                  >
                    <SafeImage
                      src={src}
                      alt={`New ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-rose)] text-white text-xs opacity-0 transition group-hover:opacity-100 shadow-md"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-[var(--color-accent)]/80 text-center text-[8px] font-bold text-white py-0.5">
                      NEW
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-[var(--color-border)]" />

          {/* Title */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
              <FileText size={15} className="text-[var(--color-accent)]" />
              Title
            </label>
            <input
              {...register("title", {
                required: "Title is required",
                minLength: { value: 3, message: "At least 3 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none transition"
              placeholder="e.g. Sunset Over Mountains"
            />
            {errors.title && <p className="mt-1 text-xs text-[var(--color-rose)]">{errors.title.message}</p>}
          </div>

          {/* Category + Price + Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                <Tag size={15} className="text-[var(--color-accent)]" />
                Category
              </label>
              <select
                {...register("category")}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none appearance-none transition"
              >
                {Object.values(ArtCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-[var(--color-rose)]">{errors.category.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                <DollarSign size={15} className="text-[var(--color-teal)]" />
                Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("price", {
                  required: "Price is required",
                  valueAsNumber: true,
                  max: { value: 1000000, message: "Max ₹10,00,000" },
                })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none transition"
              />
              {errors.price && <p className="mt-1 text-xs text-[var(--color-rose)]">{errors.price.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                <Package size={15} className="text-[var(--color-gold)]" />
                Stock
              </label>
              <input
                type="number"
                {...register("stock", {
                  required: "Stock is required",
                  valueAsNumber: true,
                })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none transition"
              />
              {errors.stock && <p className="mt-1 text-xs text-[var(--color-rose)]">{errors.stock.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
              <FileText size={15} className="text-[var(--color-accent)]" />
              Description
            </label>
            <textarea
              {...register("description", {
                required: "Description is required",
                minLength: { value: 10, message: "At least 10 characters" },
                maxLength: { value: 2000, message: "Max 2000 characters" },
              })}
              rows={4}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none transition resize-none"
              placeholder="Describe your artwork, technique, inspiration..."
            />
            {errors.description && <p className="mt-1 text-xs text-[var(--color-rose)]">{errors.description.message}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
              <Tag size={15} className="text-[var(--color-accent)]" />
              Tags
              <span className="text-xs opacity-60">(comma-separated)</span>
            </label>
            <input
              {...register("tags")}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm focus:border-[var(--color-accent)] focus:outline-none transition"
              placeholder="landscape, oil painting, nature"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="rounded-full px-6 py-2.5 text-sm font-bold border border-[var(--color-border)] hover:bg-[var(--color-card)] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] px-8 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:brightness-110 transition disabled:opacity-50"
            >
              {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
