/**
 * AdminAuthGate Component
 * Renders authentication UI when user is not authenticated
 */

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, Loader2 } from "lucide-react";

interface AdminAuthGateProps {
    hasMetaMask: boolean;
    isMetaMaskInstalled: boolean;
    isConnecting: boolean;
    onConnect: () => void;
}

export function AdminAuthGate({
    hasMetaMask,
    isMetaMaskInstalled,
    isConnecting,
    onConnect,
}: AdminAuthGateProps) {
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
                        <Button className="w-full btn-primary" onClick={onConnect} disabled={isConnecting}>
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
