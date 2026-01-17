import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Navigation } from "../Navigation";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Wrap in ThemeProvider because Navigation uses useTheme
const renderWithTheme = (component: React.ReactNode) => {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    );
};

describe("Navigation", () => {
    const defaultProps = {
        walletAddress: null,
        isAuthenticated: false,
        isConnectingWallet: false,
        isAdmin: false,
        onConnectWallet: vi.fn(),
        onDisconnectWallet: vi.fn(),
        onLoginClick: vi.fn(),
    };

    it("renders Logo correctly", () => {
        renderWithTheme(<Navigation {...defaultProps} />);
        expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("shows Login and Connect buttons when disconnected", () => {
        renderWithTheme(<Navigation {...defaultProps} />);
        expect(screen.getByText("Log in")).toBeInTheDocument();
        expect(screen.getByText("CONNECT")).toBeInTheDocument();
    });

    it("shows Wallet address and Disconnect option when connected", () => {
        renderWithTheme(<Navigation {...defaultProps} walletAddress="0x1234567890abcdef" />);
        expect(screen.getByText("0x1234...cdef")).toBeInTheDocument();

        fireEvent.click(screen.getByText("0x1234...cdef"));
        expect(defaultProps.onDisconnectWallet).toHaveBeenCalled();
    });

    it("shows Admin link only when isAdmin is true", () => {
        const { rerender } = renderWithTheme(<Navigation {...defaultProps} />);
        expect(screen.queryByText("Admin")).not.toBeInTheDocument();

        rerender(
            <ThemeProvider>
                <Navigation {...defaultProps} isAdmin={true} walletAddress="0xAdmin" />
            </ThemeProvider>
        );
        expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("shows loading state when connecting", () => {
        renderWithTheme(<Navigation {...defaultProps} isConnectingWallet={true} />);
        expect(screen.getByText("CONNECTING...")).toBeInTheDocument();
    });
});
