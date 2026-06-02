// ═══════════════════════════════════════════════════
// ArtVerse — Shared Zod Validators
// ═══════════════════════════════════════════════════

import { z } from "zod";

import { ArtCategory, UserRole } from "../types";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[a-zA-Z0-9]).{1,8}$/;

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .max(8, "Password must be at most 8 characters")
  .regex(
    PASSWORD_REGEX,
    "Password must include at least one uppercase letter and one lowercase letter"
  );

// ── Auth Validators ──

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const onboardingSchema = z.object({
  role: z.enum([UserRole.BUYER, UserRole.SELLER]),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ── Product Validators ──

export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .trim(),
  price: z.number().max(1000000, "Price exceeds maximum"),
  category: z.nativeEnum(ArtCategory),
  tags: z
    .array(z.string().trim().max(30))
    .max(10, "Maximum 10 tags allowed")
    .default([]),
  stock: z.number().int("Stock must be a whole number").default(1),
});

export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    removedImageUrls: z.array(z.string().url()).optional(),
  });

export const productFilterSchema = z.object({
  category: z.nativeEnum(ArtCategory).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  search: z.string().max(100).optional(),
  sellerId: z.string().optional(),
  isApproved: z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return val;
  }, z.boolean({ invalid_type_error: "isApproved must be a boolean" }).optional()),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "rating", "popular"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
}).superRefine((data, ctx) => {
  if (
    data.minPrice !== undefined &&
    data.maxPrice !== undefined &&
    data.minPrice > data.maxPrice
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["minPrice"],
      message: "Minimum price must be less than or equal to maximum price",
    });
  }
});

// ── Order Validators ──

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z
          .number()
          .int()
          .positive("Quantity must be positive"),
      })
    )
    .min(1, "Order must have at least one item"),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// ── Review Validators ──

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .trim()
    .optional(),
});

// ── Cart Validators ──

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  selected: z.boolean().optional(),
});

export const syncCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    })
  ),
});

// ── User Profile Validators ──

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50)
    .trim()
    .optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").trim().optional(),
  socialLinks: z
    .object({
      instagram: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      website: z.string().url().optional().or(z.literal("")),
      behance: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

// ── Group Validators ──

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name must be at most 50 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .trim()
    .optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

// ── Message Validators ──

export const sendMessageSchema = z.object({
  content: z
    .string()
    .max(2000, "Message must be at most 2000 characters")
    .trim()
    .optional()
    .default(""),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
}).superRefine((data, ctx) => {
  if (!data.content && !data.imageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "Message cannot be empty",
    });
  }
});

// ── Pagination Validator ──

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ── Type Exports ──

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type SyncCartInput = z.infer<typeof syncCartSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
