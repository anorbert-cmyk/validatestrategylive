/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ========================================
// RAPID APOLLO TYPES
// ========================================

export type Tier = "standard" | "medium" | "full";

export type AnalysisStatus = "pending_payment" | "processing" | "completed" | "failed";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentMethod = "stripe" | "coinbase";

export interface TierConfig {
  id: Tier;
  displayName: string;
  price: number;
  description: string;
  features: string[];
  isMultiPart: boolean;
  apiCalls: number;
  badge: "standard" | "medium" | "full";
}

export interface AdminStats {
  totalPurchases: number;
  totalRevenueUsd: number;
  totalRevenueCrypto: number;
  tierDistribution: {
    standard: number;
    medium: number;
    full: number;
  };
  paymentMethodDistribution: {
    stripe: number;
    coinbase: number;
  };
  conversionFunnel: {
    sessions: number;
    payments: number;
    completed: number;
  };
}

export interface Transaction {
  id: number;
  sessionId: string;
  tier: Tier;
  amountUsd: string;
  paymentMethod: PaymentMethod;
  walletAddress?: string;
  completedAt: Date;
}
