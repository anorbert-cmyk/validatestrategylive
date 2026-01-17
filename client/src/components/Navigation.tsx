import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import {
    Eye,
    LayoutDashboard,
    Loader2,
    LogIn,
    Moon,
    Sun,
    Wallet,
} from "lucide-react";

interface NavigationProps {
    walletAddress: string | null;
    isAuthenticated: boolean;
    isConnectingWallet: boolean;
    isAdmin: boolean;
    onConnectWallet: () => void;
    onDisconnectWallet: () => void;
    onLoginClick: () => void;
}

export function Navigation({
    walletAddress,
    isAuthenticated,
    isConnectingWallet,
    isAdmin,
    onConnectWallet,
    onDisconnectWallet,
    onLoginClick,
}: NavigationProps) {
    const { theme, toggleTheme } = useTheme();
    const [, navigate] = useLocation();

    const shortenAddress = (address: string) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <nav className="sticky top-6 z-40 mx-auto max-w-[95%] px-2 sm:px-4">
            <div className="border border-border bg-card/95 backdrop-blur-sm px-3 sm:px-5 py-2 sm:py-2.5 flex justify-between items-center">
                <a
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition flex-shrink-0"
                >
                    <img src="/favicon-blue.png" alt="Valid8 Strategy Logo" className="h-8 w-auto object-contain" />
                    <span className="font-bold text-[10px] sm:text-sm tracking-tight font-mono md:hidden">
                        V<span className="text-primary hidden xs:inline">8</span>
                    </span>
                    <span className="hidden md:block font-bold text-base tracking-tight">
                        Valid<span className="text-primary">8</span>
                    </span>
                </a>

                <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
                    {/* Admin Link - only visible for admin wallet */}
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin")}
                            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 text-amber-400 hover:text-amber-300 px-2 sm:px-3"
                        >
                            <LayoutDashboard className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            <span className="hidden xs:inline">Admin</span>
                        </Button>
                    )}

                    {/* Sign via Email Link (Visible when not connected) */}
                    {!walletAddress && !isAuthenticated && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLoginClick}
                            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 text-muted-foreground hover:text-foreground px-2 sm:px-3"
                        >
                            <LogIn className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            <span className="hidden xs:inline">Log in</span>
                        </Button>
                    )}

                    {/* Demo Analysis Link */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/demo-analysis")}
                        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 text-cyan-400 hover:text-cyan-300 px-2 sm:px-3"
                        aria-label="View demo analysis"
                    >
                        <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                        <span className="hidden xs:inline">Demo</span>
                    </Button>

                    {/* Theme Toggle - simplified on mobile */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-8 h-8 sm:hidden rounded-full bg-muted/50 border border-border"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="w-3.5 h-3.5 text-yellow-500" />
                        ) : (
                            <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                    </button>

                    {/* Theme Toggle - full on desktop */}
                    <div className="hidden sm:flex items-center gap-2 bg-muted/50 px-1.5 py-1.5 rounded-full border border-border">
                        <Sun className="w-3.5 h-3.5 text-yellow-500" />
                        <button
                            onClick={toggleTheme}
                            className="relative w-10 h-5 bg-muted rounded-full transition-colors duration-300 hover:bg-muted/80"
                            aria-label="Toggle theme"
                        >
                            <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-foreground rounded-full transition-transform duration-300 shadow-lg ${theme === "dark" ? "translate-x-0" : "translate-x-5"
                                    }`}
                            />
                        </button>
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>

                    {/* Connect Wallet / User */}
                    {walletAddress ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDisconnectWallet}
                            className="text-[9px] sm:text-[10px] font-bold py-1 sm:py-1.5 px-2 sm:px-3 flex items-center gap-1 sm:gap-2 font-mono"
                            aria-label="Disconnect wallet"
                        >
                            <Wallet className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-green-500" />
                            <span className="hidden xs:inline">
                                {shortenAddress(walletAddress)}
                            </span>
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onConnectWallet}
                            disabled={isConnectingWallet}
                            className="text-[9px] sm:text-[10px] font-bold py-1 sm:py-1.5 px-2 sm:px-3 flex items-center gap-1 sm:gap-2"
                            aria-label="Connect MetaMask wallet"
                        >
                            {isConnectingWallet ? (
                                <>
                                    <Loader2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 animate-spin" />
                                    <span className="hidden sm:inline">CONNECTING...</span>
                                </>
                            ) : (
                                <>
                                    <Wallet className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    <span className="hidden xs:inline">CONNECT</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}
