/**
 * StatsCards Component
 * Displays revenue, purchases, and conversion metrics
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DollarSign,
    Bitcoin,
    TrendingUp,
    BarChart3,
    Wallet,
    Users,
} from "lucide-react";
import type { AdminStats, Transaction } from "../types";

interface StatsCardsProps {
    stats: AdminStats | undefined;
    transactions: Transaction[];
    isLoading: boolean;
}

export function StatsCards({ stats, transactions, isLoading }: StatsCardsProps) {
    // Calculate derived stats
    const totalWalletPurchases = transactions.filter((tx) => tx.walletAddress).length;
    const uniqueWallets = new Set(
        transactions
            .filter((tx) => tx.walletAddress)
            .map((tx) => tx.walletAddress!.toLowerCase())
    ).size;
    const avgOrderValue = stats?.totalPurchases
        ? stats.totalRevenueUsd / stats.totalPurchases
        : 0;

    return (
        <>
            {/* Row 1: Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Revenue (USD)"
                    value={`$${stats?.totalRevenueUsd?.toFixed(2) || "0.00"}`}
                    icon={DollarSign}
                    color="green"
                    isLoading={isLoading}
                />
                <StatCard
                    label="Crypto Revenue"
                    value={`${stats?.totalRevenueCrypto?.toFixed(4) || "0"} ETH`}
                    icon={Bitcoin}
                    color="orange"
                    isLoading={isLoading}
                />
                <StatCard
                    label="Total Purchases"
                    value={String(stats?.totalPurchases || 0)}
                    icon={TrendingUp}
                    color="blue"
                    isLoading={isLoading}
                />
                <StatCard
                    label="Avg Order Value"
                    value={`$${avgOrderValue.toFixed(2)}`}
                    icon={BarChart3}
                    color="purple"
                    isLoading={isLoading}
                />
            </div>

            {/* Row 2: Wallet Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Unique Wallets"
                    value={String(uniqueWallets)}
                    icon={Wallet}
                    color="cyan"
                    isLoading={isLoading}
                    borderColor="border-cyan-500/20"
                />
                <StatCard
                    label="Wallet Purchases"
                    value={String(totalWalletPurchases)}
                    icon={Users}
                    color="indigo"
                    isLoading={isLoading}
                    borderColor="border-indigo-500/20"
                />
                <StatCard
                    label="Conversion Rate"
                    value={`${stats?.conversionFunnel?.sessions
                        ? ((stats.conversionFunnel.completed / stats.conversionFunnel.sessions) * 100).toFixed(1)
                        : "0"
                        }%`}
                    icon={TrendingUp}
                    color="amber"
                    isLoading={isLoading}
                    borderColor="border-amber-500/20"
                />
            </div>
        </>
    );
}

// ============================================
// Internal StatCard Component
// ============================================

interface StatCardProps {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: "green" | "orange" | "blue" | "purple" | "cyan" | "indigo" | "amber";
    isLoading: boolean;
    borderColor?: string;
}

const colorMap = {
    green: { text: "text-green-500", bg: "bg-green-500/10" },
    orange: { text: "text-orange-500", bg: "bg-orange-500/10" },
    blue: { text: "text-blue-500", bg: "bg-blue-500/10" },
    purple: { text: "text-purple-500", bg: "bg-purple-500/10" },
    cyan: { text: "text-cyan-500", bg: "bg-cyan-500/10" },
    indigo: { text: "text-indigo-500", bg: "bg-indigo-500/10" },
    amber: { text: "text-amber-500", bg: "bg-amber-500/10" },
};

function StatCard({ label, value, icon: Icon, color, isLoading, borderColor }: StatCardProps) {
    const colors = colorMap[color];

    return (
        <Card className={`glass-panel border-white/5 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 ${borderColor || ""}`}>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24 mt-2 bg-white/5" />
                        ) : (
                            <p className={`text-2xl font-bold tracking-tight mt-1 ${colors.text}`}>{value}</p>
                        )}
                    </div>
                    <div
                        className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center border border-white/5`}
                        aria-hidden="true"
                    >
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
