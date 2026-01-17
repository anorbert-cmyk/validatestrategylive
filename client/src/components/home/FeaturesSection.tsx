import { PhysicsSection } from "./features/PhysicsSection";
import { ProcessSection } from "./features/ProcessSection";
import { EquationSection } from "./features/EquationSection";
import { ComparisonSection } from "./features/ComparisonSection";
import { ResearchSection } from "./features/ResearchSection";
import { DesignToolsSection } from "./features/DesignToolsSection";
import { TestimonialsSection } from "./features/TestimonialsSection";

export function FeaturesSection() {
    return (
        <>
            <PhysicsSection />
            <ProcessSection />
            <ResearchSection />
            <EquationSection />
            <ComparisonSection />
            <TestimonialsSection />
            <DesignToolsSection />
        </>
    );
}
