import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, Shield, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Admin wallet address (should match server-side)
// Ideally this should come from env vars, but kept as constant for migration safety
const ADMIN_WALLET = "0xa14504ffe5E9A245c9d4079547Fa16fA0A823114".toLowerCase();

interface AdminShellProps {
    children: React.ReactNode;
    onRefreshData?: () => void;
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
    adminAuth: { signature: string; timestamp: number; address: string } | null;
    setAdminAuth: (auth: { signature: string; timestamp: number; address: string } | null) => void;
    walletAddress: string | null;
    setWalletAddress: (addr: string | null) => void;
}

export function AdminShell({
    children,
    onRefreshData,
    isAuthenticated,
    setIsAuthenticated,
    adminAuth,
    setAdminAuth,
    walletAddress,
    setWalletAddress,
}: AdminShellProps) {
    const [isConnecting, setIsConnecting] = useState(false);

    // Mutations
    const requestChallenge = trpc.admin.requestChallenge.useMutation();
    const verifySignature = trpc.admin.verifySignature.useMutation();

    // Check metamask availability
    const hasMetaMask = typeof window !== "undefined" && typeof (window as any).ethereum !== "undefined";
    const isMetaMaskInstalled = hasMetaMask && (window as any).ethereum.isMetaMask;

    // Wallet Connection Logic
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
            const message = `Valid8 Admin Console\n\nChallenge: ${challenge}\nTimestamp: ${timestamp}\n\nSign this message to authenticate.`;
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
                setAdminAuth(null);
            }
        };

        ethereum.on("accountsChanged", handleAccountsChanged);
        return () => ethereum.removeListener("accountsChanged", handleAccountsChanged);
    }, [hasMetaMask, setIsAuthenticated, setWalletAddress, setAdminAuth]);

    // Not authenticated view
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full glass-panel">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-semibold leading-none tracking-tight">Admin Access</h1>
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
                                <p className="text-xs text-muted-foreground mt-4">
                                    After installing, refresh this page
                                </p>
                            </div>
                        ) : !isMetaMaskInstalled ? (
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                    A Web3 wallet was detected but it doesn't appear to be MetaMask.
                                    Please make sure MetaMask is your active wallet.
                                </p>
                                <Button asChild>
                                    <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                                        Get MetaMask
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

    return (
        <div className="admin-container">
            {/* Noise Texture Overlay */}
            <div className="bg-noise" />

            {/* Fractal Blob Background - Technical Brutalist */}
            <div className="fractal-container">
                <div className="fractal-blob blob-1" />
                <div className="fractal-blob blob-2" />
                <div className="fractal-blob blob-3" />
            </div>

            {/* Header - Technical Brutalist */}
            <header className="admin-header">
                <div className="container flex items-center justify-between h-14">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-primary/50 bg-primary/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <h1 className="font-mono font-bold text-sm uppercase tracking-wider">Admin Dashboard</h1>
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
                        <Button variant="ghost" size="sm" onClick={onRefreshData} aria-label="Refresh data">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container py-8 space-y-8">
                {children}
            </div>
        </div>
    );
}
