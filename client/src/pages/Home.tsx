import { useAuth } from "@/_core/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { FAQSection } from "@/components/home/FAQSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HeroSection } from "@/components/home/HeroSection";
import { PricingSection } from "@/components/home/PricingSection";
import { trpc } from "@/lib/trpc";
import type { Tier } from "@shared/pricing";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// Admin wallet address from environment
const ADMIN_WALLET = (
  import.meta.env.VITE_ADMIN_WALLET_ADDRESS ||
  "0xa14504ffe5E9A245c9d4079547Fa16fA0A823114"
).toLowerCase();

export default function Home() {
  const { user, isAuthenticated, loginWithWallet } = useAuth();
  const [location, navigate] = useLocation();
  const getSiweNonce = trpc.auth.getSiweNonce.useMutation();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [problemStatement, setProblemStatement] = useState("");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  // Honeypot spam protection
  const [honeypot, setHoneypot] = useState("");

  // Priority tracking from email campaign
  const [isPriority, setIsPriority] = useState(false);

  // Check for priority parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const priorityParam = urlParams.get("priority");
    if (priorityParam === "PRIORITY") {
      setIsPriority(true);
      // Store in sessionStorage so it persists through checkout
      sessionStorage.setItem("prioritySource", "email_campaign_dec2024");
      toast.success(
        "Priority access activated! Your analysis will be processed first.",
        {
          duration: 5000,
        }
      );
    }
  }, []);

  // MetaMask wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const hasMetaMask =
    typeof window !== "undefined" &&
    typeof (window as any).ethereum !== "undefined";

  // Check for existing wallet connection on mount - NO auto redirect
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (hasMetaMask) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            const address = accounts[0].toLowerCase();
            setWalletAddress(address);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    checkWalletConnection();
  }, [hasMetaMask]);

  // Listen for account changes
  useEffect(() => {
    if (hasMetaMask) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletAddress(null);
        } else {
          const address = accounts[0].toLowerCase();
          setWalletAddress(address);
        }
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        (window as any).ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, [hasMetaMask]);

  // Connect wallet function (SIWE Flow)
  const connectWallet = async () => {
    if (!hasMetaMask) {
      toast.error("MetaMask not found", {
        description: "Please install MetaMask to connect your wallet",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnectingWallet(true);

    try {
      // 1. Request accounts
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) throw new Error("No accounts found");
      const address = accounts[0].toLowerCase();
      setWalletAddress(address);

      // Check if admin wallet (bypass SIWE for admin view only, REAL admin auth happens in dashboard)
      if (address === ADMIN_WALLET && ADMIN_WALLET) {
        toast.success("Admin wallet detected", {
          description: "Redirecting to admin dashboard...",
        });
        navigate("/admin");
        return; // Skip SIWE for admin quick-access
      }

      // 2. Get Nonce from backend
      toast.info("Please sign the message to verify ownership", {
        duration: 4000,
      });
      const { nonce, message } = await getSiweNonce.mutateAsync({
        walletAddress: address,
      });

      if (!message) throw new Error("Failed to generate SIWE message");

      // 3. User signs the message
      const signature = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      // 4. Verify signature & Login
      toast.loading("Verifying signature...");
      await loginWithWallet(address, signature, message, nonce);

      toast.success("Successfully logged in", {
        description: `Connected as ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      if (error.code === 4001) {
        toast.error("Connection rejected", {
          description: "You rejected the connection request",
        });
      } else {
        toast.error("Login failed", {
          description: error.message || "Failed to verify wallet",
        });
      }
    } finally {
      setIsConnectingWallet(false);
      toast.dismiss(); // Dismiss loading toasts
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWalletAddress(null);
    toast.info("Wallet disconnected");
  };

  const createSession = trpc.session.create.useMutation({
    onSuccess: (data) => {
      const priorityParam = isPriority ? "&priority=true" : "";
      navigate(
        `/checkout/${data.sessionId}?tier=${selectedTier}${priorityParam}`
      );
    },
  });

  const handleStartAnalysis = (tier: Tier) => {
    // Spam protection - if honeypot is filled, silently reject
    if (honeypot) {
      toast.success("Analysis started!"); // Fake success to confuse bots
      return;
    }
    if (!problemStatement.trim()) {
      return;
    }
    setSelectedTier(tier);
    const prioritySource = sessionStorage.getItem("prioritySource");
    createSession.mutate({
      problemStatement: problemStatement.trim(),
      tier,
      isPriority: isPriority,
      prioritySource: prioritySource || undefined,
    });
  };

  return (
    <div className="min-h-screen relative">
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      {/* Noise Texture */}
      <div className="bg-noise" />

      {/* Fractal Blob Background */}
      <div className="fractal-container">
        <div className="fractal-blob blob-1" />
        <div className="fractal-blob blob-2" />
        <div className="fractal-blob blob-3" />
      </div>

      <Navigation
        walletAddress={walletAddress}
        isAuthenticated={isAuthenticated}
        isConnectingWallet={isConnectingWallet}
        isAdmin={!!(walletAddress && walletAddress === ADMIN_WALLET)}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
        onLoginClick={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content - Accessibility Landmark */}
      <main id="main-content">
        <HeroSection
          problemStatement={problemStatement}
          setProblemStatement={setProblemStatement}
          honeypot={honeypot}
          setHoneypot={setHoneypot}
          createSessionIsPending={createSession.isPending}
          onNavigateToDemo={() => navigate("/demo-analysis")}
        />

        <FeaturesSection />

        <PricingSection
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          onStartAnalysis={handleStartAnalysis}
          isProcessing={createSession.isPending}
          isProblemStatementValid={!!problemStatement.trim()}
        />

        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
