import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FAQSection } from "../FAQSection";

describe("FAQSection", () => {
    it("renders FAQ questions", () => {
        render(<FAQSection />);
        expect(screen.getByText("How does the validation machine work?")).toBeInTheDocument();
    });

    it("expands answer on click", () => {
        render(<FAQSection />);
        const question = screen.getByText("How does the validation machine work?");

        // Initial state check (Radix UI accordion details might be hidden but exist in DOM)
        // We check for interaction mainly
        fireEvent.click(question);

        expect(screen.getByText(/We don't just 'analyze'/)).toBeVisible();
    });
});
