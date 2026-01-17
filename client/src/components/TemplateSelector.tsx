/**
 * Problem Statement Templates
 * Pre-filled starters to help users write better problem statements
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Rocket,
    ShoppingCart,
    Smartphone,
    RefreshCcw,
    Coins,
    Gamepad2,
    Building2,
    Sparkles,
    ChevronDown,
} from "lucide-react";

export interface ProblemTemplate {
    id: string;
    name: string;
    icon: React.ElementType;
    category: string;
    template: string;
    placeholders: string[];
}

export const PROBLEM_TEMPLATES: ProblemTemplate[] = [
    {
        id: "saas-mvp",
        name: "SaaS MVP Validation",
        icon: Rocket,
        category: "Software",
        template: `I'm building a [B2B/B2C] SaaS for [target industry] that helps [user type] solve [specific problem].

My solution: [brief description of your product].

Current stage: [idea/prototype/MVP/launched].
Target market: [geography/industry].
Competition: [main competitors or "no direct competition"].`,
        placeholders: ["B2B/B2C", "target industry", "user type", "specific problem", "brief description", "idea/prototype/MVP/launched", "geography/industry", "main competitors"],
    },
    {
        id: "ecommerce",
        name: "E-commerce Product",
        icon: ShoppingCart,
        category: "Commerce",
        template: `I want to launch [product type] targeting [customer segment].

Product: [what you're selling].
Price point: [$X - $Y].
Unique angle: [what makes it different].
Sales channel: [DTC/Amazon/Retail].
Current validation: [none/surveys/pre-orders].`,
        placeholders: ["product type", "customer segment", "what you're selling", "$X - $Y", "what makes it different", "DTC/Amazon/Retail", "none/surveys/pre-orders"],
    },
    {
        id: "mobile-app",
        name: "Mobile App Idea",
        icon: Smartphone,
        category: "Mobile",
        template: `I'm creating a [iOS/Android/both] app for [user type] who struggle with [pain point].

Core feature: [main functionality].
Monetization: [freemium/subscription/one-time/ads].
Similar apps: [competitors].
Why mine is better: [differentiator].`,
        placeholders: ["iOS/Android/both", "user type", "pain point", "main functionality", "freemium/subscription/one-time/ads", "competitors", "differentiator"],
    },
    {
        id: "marketplace",
        name: "Marketplace/Platform",
        icon: RefreshCcw,
        category: "Platform",
        template: `Building a [2-sided/multi-sided] marketplace connecting [supply side] with [demand side].

Value prop for sellers: [what they get].
Value prop for buyers: [what they get].
Revenue model: [commission/subscription/featured listings].
Chicken-egg strategy: [which side to build first].`,
        placeholders: ["2-sided/multi-sided", "supply side", "demand side", "what sellers get", "what buyers get", "commission/subscription/featured listings", "which side first"],
    },
    {
        id: "fintech",
        name: "Fintech Solution",
        icon: Coins,
        category: "Finance",
        template: `I'm building a financial product that helps [user type] with [financial problem].

Solution type: [payments/lending/investing/banking/insurance].
Target segment: [retail/SMB/enterprise].
Regulatory considerations: [licenses needed or "exploring"].
Key differentiator: [what makes it unique].`,
        placeholders: ["user type", "financial problem", "payments/lending/investing/banking/insurance", "retail/SMB/enterprise", "licenses needed", "what makes it unique"],
    },
    {
        id: "gaming",
        name: "Gaming/Entertainment",
        icon: Gamepad2,
        category: "Entertainment",
        template: `I'm developing a [game/entertainment app] for [audience type].

Genre/Type: [casual/hardcore/social/streaming].
Platform: [mobile/PC/console/web].
Monetization: [F2P/premium/IAP/subscription].
Unique hook: [what makes players come back].`,
        placeholders: ["game/entertainment app", "audience type", "casual/hardcore/social/streaming", "mobile/PC/console/web", "F2P/premium/IAP/subscription", "what makes players come back"],
    },
    {
        id: "b2b-service",
        name: "B2B Service/Agency",
        icon: Building2,
        category: "Services",
        template: `I'm launching a [type of service] agency/consultancy for [industry/niche].

Services offered: [list main services].
Target clients: [company size/type].
Pricing model: [hourly/project/retainer].
Current traction: [clients/leads/none].`,
        placeholders: ["type of service", "industry/niche", "main services", "company size/type", "hourly/project/retainer", "clients/leads/none"],
    },
];

interface TemplateSelectorProps {
    onSelect: (template: string) => void;
    disabled?: boolean;
}

export function TemplateSelector({ onSelect, disabled }: TemplateSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (template: ProblemTemplate) => {
        onSelect(template.template);
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="gap-2 text-xs font-mono uppercase tracking-wider border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Quick Start Templates
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Choose a template to get started
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PROBLEM_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                        <DropdownMenuItem
                            key={template.id}
                            onClick={() => handleSelect(template)}
                            className="cursor-pointer py-3"
                        >
                            <Icon className="w-4 h-4 mr-3 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="font-medium text-sm">{template.name}</div>
                                <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
