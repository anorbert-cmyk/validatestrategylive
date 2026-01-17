import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PricingSection } from "../PricingSection";

// Mock lucide-react icons components to avoid potential issues in test environment
vi.mock("lucide-react", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        CheckCircle: () => <span data-testid="icon-check" />,
        Eye: () => <span data-testid="icon-eye" />,
        Users: () => <span data-testid="icon-users" />,
        Crown: () => <span data-testid="icon-crown" />,
        Info: () => <span data-testid="icon-info" />,
    };
});

describe("PricingSection", () => {
    const defaultProps = {
        selectedTier: null,
        onSelectTier: vi.fn(),
        onStartAnalysis: vi.fn(),
        isProcessing: false,
        isProblemStatementValid: true,
    };

    it("renders pricing tiers", () => {
        render(<PricingSection {...defaultProps} />);
        expect(screen.getByText("Observer")).toBeInTheDocument();
        expect(screen.getByText("Insider")).toBeInTheDocument();
        expect(screen.getByText("Syndicate")).toBeInTheDocument();
    });

    it("calls onSelectTier when a tier card is clicked", () => {
        render(<PricingSection {...defaultProps} />);
        const observerCard = screen.getByText("Observer").closest(".huly-card");
        fireEvent.click(observerCard!);
        expect(defaultProps.onSelectTier).toHaveBeenCalledWith("standard");
    });

    it("calls onStartAnalysis when start button is clicked", () => {
        render(<PricingSection {...defaultProps} selectedTier="standard" />);
        const button = screen.getAllByText("Get Quick Validation →")[0];
        fireEvent.click(button);
        expect(defaultProps.onStartAnalysis).toHaveBeenCalledWith("standard");
    });

    it("disables start buttons when problem statement is invalid", () => {
        render(<PricingSection {...defaultProps} isProblemStatementValid={false} />);
        const buttons = screen.getAllByRole("button");
        buttons.forEach(button => {
            expect(button).toBeDisabled();
        });
    });

    it("shows processing state on buttons", () => {
        render(<PricingSection {...defaultProps} isProcessing={true} selectedTier="standard" />);
        // There are 3 tiers, so we expect 3 buttons to show Processing... or just check that at least one does
        expect(screen.getAllByText("Processing...")[0]).toBeInTheDocument();
    });
});
