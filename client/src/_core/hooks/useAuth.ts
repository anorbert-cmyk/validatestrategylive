import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useMemo } from "react";

/**
 * Auth hook for passwordless authentication
 * No redirect on unauthenticated - users access analyses via sessionId (public link)
 * Auth is only needed for user dashboard/history
 */
export function useAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const loginWithWalletMutation = trpc.auth.verifySiwe.useMutation({
    onSuccess: (data) => {
      utils.auth.me.setData(undefined, {
        id: 0,
        openId: `wallet:${data.sessionId || 'unknown'}`,
        email: null,
        name: null,
        role: "user",
        walletAddress: null, // Will be updated on refetch
        loginMethod: "siwe",
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      utils.auth.me.invalidate();
    },
  });

  const loginWithMagicLinkMutation = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: (data) => {
      utils.auth.me.setData(undefined, {
        id: 0,
        openId: `email:${data.email}`,
        email: data.email ?? null,
        name: null,
        role: "user",
        walletAddress: null,
        loginMethod: "magic_link",
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      utils.auth.me.invalidate();
    },
  });

  const loginWithWallet = useCallback(async (address: string, signature: string, message: string, nonce: string) => {
    try {
      return await loginWithWalletMutation.mutateAsync({
        address,
        signature,
        message,
        nonce,
      });
    } catch (error) {
      console.error("Wallet login failed:", error);
      throw error;
    }
  }, [loginWithWalletMutation]);

  const loginWithMagicLink = useCallback(async (token: string) => {
    try {
      return await loginWithMagicLinkMutation.mutateAsync({ token });
    } catch (error) {
      console.error("Magic link login failed:", error);
      throw error;
    }
  }, [loginWithMagicLinkMutation]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending || loginWithWalletMutation.isPending || loginWithMagicLinkMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? loginWithWalletMutation.error ?? loginWithMagicLinkMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    loginWithWalletMutation.error,
    loginWithWalletMutation.isPending,
    loginWithMagicLinkMutation.error,
    loginWithMagicLinkMutation.isPending,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    loginWithWallet,
    loginWithMagicLink,
  };
}
