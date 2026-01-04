/**
 * Admin Dashboard - Orchestrator Component
 * Thin wrapper that composes domain-specific components
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, RefreshCw } from "lucide-react";

// Hooks
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useTransactions } from "./hooks/useTransactions";

// Components
import { AdminAuthGate } from "./components/AdminAuthGate";
import { StatsCards } from "./components/StatsCards";
import { TransactionsTable } from "./components/TransactionsTable";

// Legacy: Import remaining sections from original file
// TODO: Extract these into separate components in future iterations
import { trpc } from "@/lib/trpc";

export default function Admin() {
    // Authentication
    const {
        walletAddress,
        isConnecting,
        isAuthenticated,
        adminAuth,
        hasMetaMask,
        isMetaMaskInstalled,
        connectWallet,
    } = useAdminAuth();

    // Transactions
    const {
        transactions,
        filteredTransactions,
        isLoading: txLoading,
        searchQuery,
        setSearchQuery,
        sortField,
        sortDirection,
        refetch: refetchTx,
        toggleSort,
    } = useTransactions(adminAuth);

    // Stats query (still inline for now, will extract later)
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.getStats.useQuery(
        adminAuth || { signature: "", timestamp: 0, address: "" },
        { enabled: isAuthenticated && !!adminAuth, retry: false }
    );

    // Not authenticated - show connect screen
    if (!isAuthenticated) {
        return (
            <AdminAuthGate
                hasMetaMask={hasMetaMask}
                isMetaMaskInstalled={isMetaMaskInstalled}
                isConnecting={isConnecting}
                onConnect={connectWallet}
            />
        );
    }

    // Authenticated - show admin dashboard
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-10 bg-background/80">
                <div className="container flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <Shield className="h-6 w-6 text-primary" />
                        <h1 className="font-bold text-lg">Admin Dashboard</h1>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                            Live
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-mono text-xs">
                            <Wallet className="h-3 w-3 mr-1" />
                            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                refetchStats();
                                refetchTx();
                            }}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container py-8 space-y-8">
                {/* Stats Cards */}
                <StatsCards
                    stats={stats as any}
                    transactions={transactions as any}
                    isLoading={statsLoading || txLoading}
                />

                {/* Transactions Table */}
                <TransactionsTable
                    transactions={filteredTransactions as any}
                    isLoading={txLoading}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onToggleSort={toggleSort}
                />

                {/* 
          TODO: Extract these in Phase 3:
          - TierDistribution
          - PaymentMethods  
          - ConversionFunnel
          - OperationsPanel
          - MetricsDashboard
          - EmailSubscribers
          
          For now, using simplified dashboard.
          Full features available in original Admin.tsx
        */}
            </div>
        </div>
    );
}
