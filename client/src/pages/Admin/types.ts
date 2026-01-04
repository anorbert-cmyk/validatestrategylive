/**
 * Admin Module Types
 * Shared interfaces for the Admin dashboard components
 */

// ============================================
// Authentication Types
// ============================================

export interface AdminAuth {
    signature: string;
    timestamp: number;
    address: string;
}

// ============================================
// Transaction Types
// ============================================

export interface Transaction {
    id: number | string;
    sessionId: string;
    walletAddress: string | null;
    tier: "standard" | "medium" | "full";
    amountUsd: string;
    amountCrypto: string | null;
    paymentMethod?: string;
    status?: "pending" | "completed" | "failed";
    createdAt: string | Date;
    completedAt: string | Date | null;
}

export type SortField = "date" | "amount" | "tier";
export type SortDirection = "asc" | "desc";

// ============================================
// Stats Types
// ============================================

export interface TierDistribution {
    standard: number;
    medium: number;
    full: number;
}

export interface PaymentMethodDistribution {
    stripe: number;
    coinbase: number;
    paypal: number;
    nowpayments: number;
}

export interface ConversionFunnel {
    sessions: number;
    payments: number;
    completed: number;
}

export interface AdminStats {
    totalRevenueUsd: number;
    totalRevenueCrypto: number;
    totalPurchases: number;
    tierDistribution: TierDistribution;
    paymentMethodDistribution: PaymentMethodDistribution;
    conversionFunnel: ConversionFunnel;
}

// ============================================
// Operations Types
// ============================================

export type OperationState =
    | "initialized"
    | "generating"
    | "part_complete"
    | "paused"
    | "resuming"
    | "completed"
    | "failed"
    | "cancelled";

export interface Operation {
    id: string;
    sessionId: string;
    tier: "standard" | "medium" | "full";
    state: OperationState;
    completedParts: number;
    totalParts: number;
    createdAt: string;
    updatedAt: string;
    errorCode?: string;
    errorMessage?: string;
}

export interface OperationEvent {
    type: string;
    timestamp: string;
    data?: Record<string, unknown>;
}

export interface OperationDetails extends Operation {
    events: OperationEvent[];
    problemStatement?: string;
}

// ============================================
// Metrics Types
// ============================================

export interface HourlyMetric {
    hour: string;
    success: number;
    failure: number;
    avgDuration: number;
}

export interface HistoricalMetrics {
    hourlyData: HourlyMetric[];
    totalSuccess: number;
    totalFailure: number;
    avgDuration: number;
}

export interface RetryQueueStats {
    pending: number;
    processing: number;
    failed: number;
    processorRunning: boolean;
}

// ============================================
// Error Types
// ============================================

export interface ErrorItem {
    id: string;
    type: string;
    message: string;
    sessionId?: string;
    timestamp: string;
    count: number;
}

export interface ErrorDashboard {
    circuitBreakerOpen: boolean;
    recentErrors: ErrorItem[];
    errorsByType: Record<string, number>;
}

// ============================================
// Email Types
// ============================================

export interface EmailSubscriber {
    id: string;
    email: string;
    source: string;
    isVerified: boolean;
    subscribedAt: string;
    verifiedAt: string | null;
}

export interface EmailStats {
    total: number;
    verified: number;
    unverified: number;
    verificationRate: number;
}

// ============================================
// Utility Constants
// ============================================

export const ADMIN_WALLET = "0xa14504ffe5E9A245c9d4079547Fa16fA0A823114".toLowerCase();

export const TIER_COLORS = {
    standard: "bg-slate-500",
    medium: "bg-indigo-500",
    full: "bg-purple-500",
} as const;

export const TIER_LABELS = {
    standard: "Observer",
    medium: "Insider",
    full: "Syndicate",
} as const;

export const TIER_PRICES = {
    standard: "$9",
    medium: "$29",
    full: "$79",
} as const;
