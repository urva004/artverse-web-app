"use client";

import { motion } from "framer-motion";
import {
  Upload,
  X,
  Image as ImageIcon,
  DollarSign,
  Package,
  Tag,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArtCategory, CATEGORY_LABELS } from "@artverse/utils";
import { api, toastApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface ArtworkForm {
  title: string;
  description: string;
  price: number;
  stock: number;
  category: ArtCategory;
  tags: string;
}

export default function UploadArtworkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArtworkForm>({
    defaultValues: {
      stock: 1,
      category: ArtCategory.PAINTINGS,
    },
  });

  const addFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && images.length + 1 <= 5
    );
    const allowed = newFiles.slice(0, 5 - images.length);
    if (allowed.length === 0) {
      if (images.length >= 5) toast.error("Maximum 5 images allowed");
      return;
    }

    setImages((prev) => [...prev, ...allowed]);
    allowed.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result =
          typeof reader.result === "string" ? reader.result.trim() : "";

        if (!result) {
          return;
        }

        setPreviews((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [images.length]
  );

  // ── Access check (MUST be after all hooks) ──
  if (
    !isAuthenticated ||
    (user?.role !== "SELLER" && user?.role !== "ADMIN")
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="font-display text-xl">Access Denied</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Only sellers can upload artworks
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

  const onSubmit = async (data: ArtworkForm) => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("price", String(data.price));
      formData.append("stock", String(data.stock));
      formData.append("category", data.category);

      const tags = data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      formData.append("tags", JSON.stringify(tags));

      images.forEach((file) => {
        formData.append("images", file);
      });

      await api.post("/artworks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Clear the stale portfolio cache so the new product is visible instantly 
      queryClient.invalidateQueries({ queryKey: ["artist-products", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["artist", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["artworks"] });

      toast.success("Artwork uploaded successfully! 🎨");
      router.push(`/artists/${user?.id}`);
    } catch (err: any) {
      toastApiError(err, "Failed to upload artwork");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href={`/artists/${user?.id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Link>

        <h1 className="mb-2 font-display text-display-sm">
          Upload <span className="gradient-text">Artwork</span>
        </h1>
        <p className="mb-8 text-sm text-[var(--color-muted)]">
          Share your art with the world and set your price
        </p>

        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <ImageIcon size={16} className="text-[var(--color-accent)]" />
                Artwork Images
                <span className="text-xs text-[var(--color-muted)]">
                  (up to 5, JPG/PNG/WebP)
                </span>
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-input border-2 border-dashed transition-all ${
                  dragActive
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                }`}
              >
                <Upload
                  size={28}
                  className="mb-2 text-[var(--color-muted)]"
                />
                <p className="text-sm text-[var(--color-muted)]">
                  Drag & drop images here or{" "}
                  <span className="font-medium text-[var(--color-accent)]">
                    browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Max 5MB per image
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hidden"
              />

              {/* Previews */}
              {previews.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {previews.map((src, i) => {
                    const previewSrc = typeof src === "string" ? src.trim() : "";

                    return (
                      <div
                        key={i}
                        className="group relative h-20 w-20 overflow-hidden rounded-input border border-[var(--color-border)]"
                      >
                        {previewSrc ? (
                          <Image
                            src={previewSrc}
                            alt={`Preview ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg-muted)] text-[var(--color-muted)]">
                            <ImageIcon size={18} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(i);
                          }}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-rose)] text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <FileText size={16} className="text-[var(--color-accent)]" />
                Title
              </label>
              <input
                type="text"
                {...register("title", {
                  required: "Title is required",
                  minLength: { value: 3, message: "At least 3 characters" },
                })}
                placeholder="e.g. Sunset Over Mountains"
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <FileText size={16} className="text-[var(--color-accent)]" />
                Description
              </label>
              <textarea
                {...register("description", {
                  required: "Description is required",
                  minLength: {
                    value: 10,
                    message: "At least 10 characters",
                  },
                })}
                rows={4}
                placeholder="Describe your artwork, technique, inspiration..."
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                  <DollarSign
                    size={16}
                    className="text-[var(--color-accent)]"
                  />
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("price", {
                    required: "Price is required",
                    valueAsNumber: true,
                  })}
                  placeholder="999"
                  className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-[var(--color-rose)]">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                  <Package
                    size={16}
                    className="text-[var(--color-accent)]"
                  />
                  Stock
                </label>
                <input
                  type="number"
                  {...register("stock", {
                    required: "Stock is required",
                    valueAsNumber: true,
                  })}
                  placeholder="1"
                  className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                />
                {errors.stock && (
                  <p className="mt-1 text-xs text-[var(--color-rose)]">
                    {errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <Tag size={16} className="text-[var(--color-accent)]" />
                Category
              </label>
              <select
                {...register("category", { required: "Category is required" })}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              >
                {Object.values(ArtCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <Tag size={16} className="text-[var(--color-accent)]" />
                Tags
                <span className="text-xs text-[var(--color-muted)]">
                  (comma-separated)
                </span>
              </label>
              <input
                type="text"
                {...register("tags")}
                placeholder="landscape, oil painting, nature"
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] text-sm font-semibold text-white shadow-glow hover:shadow-glow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Upload size={18} />
                  Upload Artwork
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
