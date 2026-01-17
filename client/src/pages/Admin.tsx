import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Import new modular components
import { AdminShell } from "@/components/admin/AdminShell";
import { StatsOverview } from "@/components/admin/StatsOverview";
import { OperationsMonitor } from "@/components/admin/OperationsMonitor";
import { ErrorDashboard } from "@/components/admin/ErrorDashboard";
import { LogViewer } from "@/components/admin/LogViewer";
import { TransactionHistory } from "@/components/admin/TransactionHistory";
import { EmailSubscribers } from "@/components/admin/EmailSubscribers";

export default function Admin() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminAuth, setAdminAuth] = useState<{ signature: string; timestamp: number; address: string } | null>(null);

  // Historical metrics time range state
  const [metricsTimeRange, setMetricsTimeRange] = useState<24 | 168 | 720>(24);

  // ============ PROPS / DATA FETCHING ============

  // 1. Stats Query
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    error: statsError
  } = trpc.admin.getStats.useQuery(
    adminAuth || { signature: "", timestamp: 0, address: "" },
    {
      enabled: isAuthenticated && !!adminAuth,
      retry: false,
    }
  );

  // Handle token expiration
  useEffect(() => {
    if (statsError?.message?.includes('expired') || statsError?.message?.includes('Invalid')) {
      toast.error("Session expired", { description: "Please sign in again" });
      setIsAuthenticated(false);
      setAdminAuth(null);
    }
  }, [statsError]);

  // 2. Transactions Query
  const { data: transactionsData, isLoading: txLoading, refetch: refetchTx } = trpc.admin.getTransactions.useQuery(
    adminAuth ? { ...adminAuth, limit: 100 } : { signature: "", timestamp: 0, address: "", limit: 100 },
    { enabled: isAuthenticated && !!adminAuth }
  );
  const transactions = transactionsData?.transactions || [];

  // Calculate generic tx stats
  const totalWalletPurchases = transactions.filter((tx: any) => tx.walletAddress).length;
  const uniqueWallets = new Set(transactions.filter((tx: any) => tx.walletAddress).map((tx: any) => tx.walletAddress.toLowerCase())).size;

  // 3. Email Subscribers Query
  const { data: emailData, isLoading: emailLoading, refetch: refetchEmails } = trpc.admin.getEmailSubscribers.useQuery(
    adminAuth || { signature: "", timestamp: 0, address: "" },
    { enabled: isAuthenticated && !!adminAuth }
  );
  const emailSubscribers = emailData?.subscribers || [];
  const emailStats = emailData?.stats || { total: 0, verified: 0, unverified: 0, verificationRate: 0 };

  // 4. Operations Summary & Monitor
  const { data: operationsSummary, refetch: refetchSummary } = trpc.admin.getOperationsSummary.useQuery(
    adminAuth || { signature: "", timestamp: 0, address: "" },
    { enabled: isAuthenticated && !!adminAuth, refetchInterval: 15000 }
  );

  // 5. Error Dashboard & Retry Queue
  const { data: errorDashboard, refetch: refetchErrors } = trpc.admin.getErrorDashboard.useQuery(
    adminAuth || { signature: "", timestamp: 0, address: "" },
    { enabled: isAuthenticated && !!adminAuth, refetchInterval: 30000 }
  );

  const { data: retryQueueStats, refetch: refetchQueue } = trpc.admin.getRetryQueueStats.useQuery(
    adminAuth || { signature: "", timestamp: 0, address: "" },
    { enabled: isAuthenticated && !!adminAuth, refetchInterval: 10000 }
  );

  const handleRefresh = () => {
    refetchStats();
    refetchTx();
    refetchEmails();
    refetchSummary();
    refetchErrors();
    refetchQueue();
    toast.success("Dashboard data refreshed");
  };

  return (
    <AdminShell
      isAuthenticated={isAuthenticated}
      setIsAuthenticated={setIsAuthenticated}
      adminAuth={adminAuth}
      setAdminAuth={setAdminAuth}
      walletAddress={walletAddress}
      setWalletAddress={setWalletAddress}
      onRefreshData={handleRefresh}
    >
      {/* 1. Revenue & High-Level Metrics */}
      <StatsOverview
        stats={stats}
        isLoading={statsLoading}
        txStats={{ totalWalletPurchases, uniqueWallets }}
        isTxLoading={txLoading}
      />

      {/* 2. Operations Center (The "Brain") */}
      <OperationsMonitor
        adminAuth={adminAuth}
        operationsSummary={operationsSummary}
        refetchSummary={refetchSummary}
      />

      {/* 3. System Health & Errors */}
      <ErrorDashboard
        adminAuth={adminAuth}
        errorDashboard={errorDashboard}
        retryQueueStats={retryQueueStats}
        refetchErrors={refetchErrors}
        refetchQueue={refetchQueue}
      />

      {/* 4. Live Logs */}
      <LogViewer adminAuth={adminAuth} />

      {/* 5. Data Tables (Transactions & Users) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <TransactionHistory
          transactions={transactions}
          isLoading={txLoading}
        />
        <EmailSubscribers
          subscribers={emailSubscribers}
          isLoading={emailLoading}
          stats={emailStats}
        />
      </div>
    </AdminShell>
  );
}
