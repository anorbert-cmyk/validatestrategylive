import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart3, Bitcoin, DollarSign, HelpCircle, PieChart, TrendingUp, Users, Wallet, Zap } from "lucide-react";

interface StatsOverviewProps {
    stats: any;
    isLoading: boolean;
    txStats: {
        totalWalletPurchases: number;
        uniqueWallets: number;
    };
    isTxLoading: boolean;
}

export function StatsOverview({ stats, isLoading, txStats, isTxLoading }: StatsOverviewProps) {
    const avgOrderValue = stats?.totalPurchases ? (stats.totalRevenueUsd / stats.totalPurchases) : 0;

    return (
        <>
            {/* Stats Cards - Row 1 */}
            <div className="admin-section-title">
                <Zap className="w-3 h-3" />
                Revenue Metrics
                <TooltipProvider>
                    <UITooltip>
                        <TooltipTrigger asChild>
                            <button className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
                                <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs"><strong>Revenue Metrics</strong> shows your total earnings across all payment methods. Track USD revenue from Stripe/PayPal and crypto revenue from NOWPayments.</p>
                        </TooltipContent>
                    </UITooltip>
                </TooltipProvider>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="admin-stat-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Revenue (USD)</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-green-500">${stats?.totalRevenueUsd?.toFixed(2) || "0.00"}</p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="admin-stat-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Crypto Revenue</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-24 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-orange-500">{stats?.totalRevenueCrypto?.toFixed(4) || "0"} ETH</p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Bitcoin className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="admin-stat-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Purchases</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold">{stats?.totalPurchases || 0}</p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="admin-stat-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <BarChart3 className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Cards - Row 2 (Wallet specific) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="glass-panel border-cyan-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Unique Wallets</p>
                                {isTxLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-cyan-500">{txStats.uniqueWallets}</p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-cyan-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-indigo-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Wallet Purchases</p>
                                {isTxLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-indigo-500">{txStats.totalWalletPurchases}</p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-indigo-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-amber-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-16 mt-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-amber-500">
                                        {stats?.conversionFunnel?.sessions
                                            ? ((stats.conversionFunnel.completed / stats.conversionFunnel.sessions) * 100).toFixed(1)
                                            : "0"}%
                                    </p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Tier Distribution */}
                <Card className="admin-card">
                    <CardHeader>
                        <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                            <PieChart className="h-5 w-5" />
                            Tier Distribution
                        </h2>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[
                                    { tier: "Observer", count: stats?.tierDistribution?.standard || 0, color: "bg-emerald-500", price: "$49" },
                                    { tier: "Insider", count: stats?.tierDistribution?.medium || 0, color: "bg-indigo-500", price: "$99" },
                                    { tier: "Syndicate", count: stats?.tierDistribution?.full || 0, color: "bg-purple-500", price: "$199" },
                                ].map((item) => {
                                    const total = (stats?.tierDistribution?.standard || 0) +
                                        (stats?.tierDistribution?.medium || 0) +
                                        (stats?.tierDistribution?.full || 0);
                                    const percent = total > 0 ? (item.count / total) * 100 : 0;

                                    return (
                                        <div key={item.tier} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                                    {item.tier} <span className="text-muted-foreground">({item.price})</span>
                                                </span>
                                                <span className="font-medium">{item.count} <span className="text-muted-foreground">({percent.toFixed(0)}%)</span></span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${item.color} transition-all duration-500`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
