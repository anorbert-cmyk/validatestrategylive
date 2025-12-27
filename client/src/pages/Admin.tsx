import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Users,
  CreditCard,
  Bitcoin,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Shield,
  RefreshCw,
  BarChart3,
  PieChart
} from "lucide-react";

// Admin wallet address (should match server-side)
const ADMIN_WALLET = "0xa14504ffe5E9A245c9d4079547Fa16fA0A823114".toLowerCase();

export default function Admin() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check if MetaMask is available
  const hasMetaMask = typeof window !== "undefined" && (window as any).ethereum;

  const requestChallenge = trpc.admin.requestChallenge.useMutation();
  const verifySignature = trpc.admin.verifySignature.useMutation();

  // Admin auth state for API calls
  const [adminAuth, setAdminAuth] = useState<{ signature: string; timestamp: number; address: string } | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.getStats.useQuery(
    adminAuth || { signature: "", timestamp: 0, address: "" },
    { enabled: isAuthenticated && !!adminAuth }
  );

  const { data: transactionsData, isLoading: txLoading } = trpc.admin.getTransactions.useQuery(
    adminAuth ? { ...adminAuth, limit: 50 } : { signature: "", timestamp: 0, address: "", limit: 50 },
    { enabled: isAuthenticated && !!adminAuth }
  );

  const transactions = transactionsData?.transactions || [];

  const connectWallet = async () => {
    if (!hasMetaMask) {
      toast.error("MetaMask not found", { description: "Please install MetaMask to continue" });
      return;
    }

    setIsConnecting(true);

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0]?.toLowerCase();

      if (!address) {
        toast.error("No account found");
        return;
      }

      // Check if this is the admin wallet
      if (address !== ADMIN_WALLET) {
        toast.error("Unauthorized wallet", { 
          description: "This wallet is not authorized for admin access" 
        });
        setIsConnecting(false);
        return;
      }

      setWalletAddress(address);

      // Request challenge from server
      const { challenge, timestamp } = await requestChallenge.mutateAsync({ walletAddress: address });

      // Sign the challenge
      const message = `Rapid Apollo Admin Login\n\nChallenge: ${challenge}\nTimestamp: ${timestamp}\n\nSign this message to authenticate.`;
      const signature = await ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      // Verify signature with server
    await verifySignature.mutateAsync({
        walletAddress: address,
        signature,
        challenge,
        timestamp,
      });
      setAuthToken(signature);
      setIsAuthenticated(true);
      
      // Store auth for subsequent API calls
      setAdminAuth({
        signature,
        timestamp,
        address,
      });
      
      toast.success("Admin access granted");

    } catch (error: any) {
      console.error("Wallet connection error:", error);
      if (error.code === 4001) {
        toast.error("Connection rejected", { description: "You rejected the connection request" });
      } else {
        toast.error("Authentication failed", { description: error.message });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!hasMetaMask) return;

    const ethereum = (window as any).ethereum;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0 || accounts[0]?.toLowerCase() !== ADMIN_WALLET) {
        setIsAuthenticated(false);
        setWalletAddress(null);
        setAuthToken(null);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, [hasMetaMask]);

  // Not authenticated - show connect screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full glass-panel">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>
              Connect your authorized MetaMask wallet to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasMetaMask ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  MetaMask is required for admin authentication
                </p>
                <Button asChild>
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                    Install MetaMask
                  </a>
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full btn-primary" 
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect MetaMask
                  </>
                )}
              </Button>
            )}
            
            <p className="text-xs text-center text-muted-foreground">
              Only the authorized admin wallet can access this dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - show admin dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-mono text-xs">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue (USD)</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">${stats?.totalRevenueUsd?.toFixed(2) || "0.00"}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crypto Revenue</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalRevenueCrypto?.toFixed(4) || "0"} ETH</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Bitcoin className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalPurchases || 0}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {stats?.conversionFunnel?.sessions 
                        ? ((stats.conversionFunnel.completed / stats.conversionFunnel.sessions) * 100).toFixed(1)
                        : "0"}%
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Distribution */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tier Distribution */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Tier Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { tier: "Observer", count: stats?.tierDistribution?.standard || 0, color: "bg-slate-500" },
                    { tier: "Insider", count: stats?.tierDistribution?.medium || 0, color: "bg-indigo-500" },
                    { tier: "Syndicate", count: stats?.tierDistribution?.full || 0, color: "bg-purple-500" },
                  ].map((item) => {
                    const total = (stats?.tierDistribution?.standard || 0) + 
                                  (stats?.tierDistribution?.medium || 0) + 
                                  (stats?.tierDistribution?.full || 0);
                    const percent = total > 0 ? (item.count / total) * 100 : 0;
                    
                    return (
                      <div key={item.tier} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.tier}</span>
                          <span className="text-muted-foreground">{item.count} ({percent.toFixed(0)}%)</span>
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

          {/* Payment Methods */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { method: "Stripe (Card)", count: stats?.paymentMethodDistribution?.stripe || 0, icon: CreditCard, color: "bg-blue-500" },
                    { method: "Coinbase (Crypto)", count: stats?.paymentMethodDistribution?.coinbase || 0, icon: Bitcoin, color: "bg-orange-500" },
                  ].map((item) => {
                    const total = (stats?.paymentMethodDistribution?.stripe || 0) + 
                                  (stats?.paymentMethodDistribution?.coinbase || 0);
                    const percent = total > 0 ? (item.count / total) * 100 : 0;
                    
                    return (
                      <div key={item.method} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.method}</span>
                          </div>
                          <span className="text-muted-foreground">{item.count} ({percent.toFixed(0)}%)</span>
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

        {/* Conversion Funnel */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="flex items-center justify-between gap-4">
                {[
                  { label: "Sessions", value: stats?.conversionFunnel?.sessions || 0 },
                  { label: "Payments Started", value: stats?.conversionFunnel?.payments || 0 },
                  { label: "Completed", value: stats?.conversionFunnel?.completed || 0 },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex-1 text-center">
                    <div className="text-3xl font-bold">{step.value}</div>
                    <div className="text-sm text-muted-foreground">{step.label}</div>
                    {i < arr.length - 1 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.value > 0 
                          ? `${((arr[i + 1].value / step.value) * 100).toFixed(0)}% →`
                          : "0% →"
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">
                        {tx.sessionId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tx.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>${tx.amountUsd}</TableCell>
                      <TableCell>
                        {tx.paymentMethod === "stripe" ? (
                          <CreditCard className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Bitcoin className="h-4 w-4 text-orange-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tx.completedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
