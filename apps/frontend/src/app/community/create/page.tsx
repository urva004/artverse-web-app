"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

interface CreateGroupForm {
  name: string;
  description: string;
  type: "PUBLIC" | "PRIVATE";
}

export default function CreateGroupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateGroupForm>({
    defaultValues: { type: "PUBLIC" },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: CreateGroupForm) => {
    setIsLoading(true);
    try {
      const r = await api.post("/groups", data);
      toast.success("Group created! 🎨");
      router.push(`/community/${r.data.data.id}`);
    } catch {
      toast.error("Failed to create group");
    }
    setIsLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/community"
        className="mb-6 flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
      >
        <ArrowLeft size={16} />
        Back to Community
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="mb-2 font-display text-display-sm">
          Create <span className="gradient-text">Group</span>
        </h1>
        <p className="mb-8 text-sm text-[var(--color-muted)]">
          Start a community for artists and art lovers
        </p>

        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Watercolor Enthusiasts"
                {...register("name", {
                  required: "Name is required",
                  minLength: { value: 3, message: "Min 3 characters" },
                })}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                placeholder="What is this group about?"
                {...register("description")}
                rows={3}
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Group Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["PUBLIC", "PRIVATE"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("type", type)}
                    className={`rounded-input border px-4 py-3 text-sm font-medium transition-all ${selectedType === type ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-muted)]"}`}
                  >
                    {type === "PUBLIC" ? "🌍 Public" : "🔒 Private"}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] text-sm font-semibold text-white shadow-glow hover:shadow-glow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Users size={16} />
                  Create Group
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
