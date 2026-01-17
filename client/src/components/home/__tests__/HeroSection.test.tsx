import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HeroSection } from "../HeroSection";

describe("HeroSection", () => {
    const defaultProps = {
        problemStatement: "",
        setProblemStatement: vi.fn(),
        honeypot: "",
        setHoneypot: vi.fn(),
        createSessionIsPending: false,
        onNavigateToDemo: vi.fn(),
    };

    it("renders headline correctly", () => {
        render(<HeroSection {...defaultProps} />);
        expect(screen.getByText("DON'T GUESS.")).toBeInTheDocument();
        expect(screen.getByText("VALID8.")).toBeInTheDocument();
    });

    it("calls onNavigateToDemo when View Demo is clicked", () => {
        render(<HeroSection {...defaultProps} />);
        fireEvent.click(screen.getByText("VIEW DEMO"));
        expect(defaultProps.onNavigateToDemo).toHaveBeenCalled();
    });

    it("updates problem statement input", () => {
        render(<HeroSection {...defaultProps} />);
        const input = screen.getByPlaceholderText(/\/\/ Enter your challenge here/i);
        fireEvent.change(input, { target: { value: "New problem" } });
        expect(defaultProps.setProblemStatement).toHaveBeenCalledWith("New problem");
    });

    it("shows character count warning when under limit", () => {
        render(<HeroSection {...defaultProps} problemStatement="Too short" />);
        expect(screen.getByText(/9 \/ 2000 characters/)).toHaveClass("text-amber-400");
    });

    it("shows valid character count style when over limit", () => {
        const longText = "a".repeat(201);
        render(<HeroSection {...defaultProps} problemStatement={longText} />);
        expect(screen.getByText(/201 \/ 2000 characters/)).toHaveClass("text-green-400");
    });
});
