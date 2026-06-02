// ═══════════════════════════════════════════════════
// ArtVerse — Razorpay Payment Service
// ═══════════════════════════════════════════════════

import crypto from "crypto";

import Razorpay from "razorpay";

import { env } from "../config";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Razorpay credentials not configured", 500);
    }
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(amountInRupees: number) {
  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amountInRupees * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    logger.info(`Razorpay order created: ${order.id}, amount: ₹${amountInRupees}`);
    return order;
  } catch (error) {
    logger.error("Razorpay order creation failed:", error);
    throw new AppError("Failed to create payment order", 500);
  }
}

/**
 * Verify Razorpay payment signature (HMAC SHA256)
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );

  if (!isValid) {
    logger.warn(`Invalid Razorpay signature for order: ${orderId}`);
  }

  return isValid;
}
