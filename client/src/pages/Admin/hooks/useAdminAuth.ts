/**
 * useAdminAuth Hook
 * Encapsulates wallet connection and admin authentication logic
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ADMIN_WALLET, AdminAuth } from "../types";

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean;
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}

interface UseAdminAuthReturn {
    // State
    walletAddress: string | null;
    isConnecting: boolean;
    isAuthenticated: boolean;
    adminAuth: AdminAuth | null;

    // Derived
    hasMetaMask: boolean;
    isMetaMaskInstalled: boolean;

    // Actions
    connectWallet: () => Promise<void>;
    logout: () => void;
}

export function useAdminAuth(): UseAdminAuthReturn {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminAuth, setAdminAuth] = useState<AdminAuth | null>(null);

    // Check MetaMask availability
    const hasMetaMask = typeof window !== "undefined" && typeof window.ethereum !== "undefined";
    const isMetaMaskInstalled = hasMetaMask && !!window.ethereum?.isMetaMask;

    // tRPC mutations
    const requestChallenge = trpc.admin.requestChallenge.useMutation();
    const verifySignature = trpc.admin.verifySignature.useMutation();

    const connectWallet = useCallback(async () => {
        if (!hasMetaMask || !window.ethereum) {
            toast.error("MetaMask not found", { description: "Please install MetaMask to continue" });
            return;
        }

        setIsConnecting(true);

        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
            const address = accounts[0]?.toLowerCase();

            if (!address) {
                toast.error("No account found");
                return;
            }

            // Check if this is the admin wallet
            if (address !== ADMIN_WALLET) {
                toast.error("Unauthorized wallet", {
                    description: "This wallet is not authorized for admin access",
                });
                setIsConnecting(false);
                return;
            }

            setWalletAddress(address);

            // Request challenge from server
            const { challenge, timestamp } = await requestChallenge.mutateAsync({ walletAddress: address });

            // Sign the challenge
            const message = `Valid8 Admin Console\n\nChallenge: ${challenge}\nTimestamp: ${timestamp}\n\nSign this message to authenticate.`;
            const signature = await window.ethereum.request({
                method: "personal_sign",
                params: [message, address],
            }) as string;

            // Verify signature with server
            await verifySignature.mutateAsync({
                walletAddress: address,
                signature,
                challenge,
                timestamp,
            });

            setIsAuthenticated(true);
            setAdminAuth({ signature, timestamp, address });
            toast.success("Admin access granted");
        } catch (error: unknown) {
            const err = error as { code?: number; message?: string };
            console.error("Wallet connection error:", error);
            if (err.code === 4001) {
                toast.error("Connection rejected", { description: "You rejected the connection request" });
            } else {
                toast.error("Authentication failed", { description: err.message || "Unknown error" });
            }
        } finally {
            setIsConnecting(false);
        }
    }, [hasMetaMask, requestChallenge, verifySignature]);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
        setWalletAddress(null);
        setAdminAuth(null);
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (!hasMetaMask || !window.ethereum) return;

        const handleAccountsChanged = (accounts: unknown) => {
            const accs = accounts as string[];
            if (accs.length === 0 || accs[0]?.toLowerCase() !== ADMIN_WALLET) {
                logout();
            }
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        return () => window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    }, [hasMetaMask, logout]);

    return {
        walletAddress,
        isConnecting,
        isAuthenticated,
        adminAuth,
        hasMetaMask,
        isMetaMaskInstalled,
        connectWallet,
        logout,
    };
}
