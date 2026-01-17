import {
    CheckCircle,
    Eye,
    Users,
    Crown,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { TIER_CONFIGS, type Tier } from "@shared/pricing";

interface PricingSectionProps {
    selectedTier: Tier | null;
    onSelectTier: (tier: Tier) => void;
    onStartAnalysis: (tier: Tier) => void;
    isProcessing: boolean;
    isProblemStatementValid: boolean;
}

export function PricingSection({
    selectedTier,
    onSelectTier,
    onStartAnalysis,
    isProcessing,
    isProblemStatementValid
}: PricingSectionProps) {

    const handleStartClick = (e: React.MouseEvent, tier: Tier) => {
        e.stopPropagation();
        onStartAnalysis(tier);
    };

    return (
        <>
            <section id="mint" className="py-16 md:py-32 relative z-10 border-y border-border bg-muted/20">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

                <div className="max-w-7xl mx-auto px-4 relative">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-16">
                        <div>
                            <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1 mb-4">
                                <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Deployment Tiers</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Product Validation <span className="text-primary">Pricing</span>
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm font-mono md:text-right max-w-xs">
                            The market doesn't forgive bad strategy.
                        </p>
                    </div>

                    <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:items-stretch">
                        {/* Tier 1: Observer - Base Tier */}
                        <div
                            className={`huly-card group order-2 md:order-1 ${selectedTier === 'standard' ? 'huly-active scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                            onClick={() => onSelectTier('standard')}
                        >
                            <div className="huly-content">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Eye className={`w-5 h-5 ${selectedTier === 'standard' ? 'text-foreground' : 'text-muted-foreground'}`} />
                                        <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${selectedTier === 'standard' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            Observer
                                        </h3>
                                    </div>
                                    <span className="px-2 py-1 text-[10px] font-bold bg-muted border border-border rounded-full text-muted-foreground tracking-wider">
                                        QUICK VALIDATION
                                    </span>
                                </div>

                                <h4 className="text-xl font-bold mb-2 ">Validation Check</h4>
                                <p className="text-xs text-muted-foreground mb-4">Stop the bleeding. Confirm if your direction is viable before you burn another dollar.</p>

                                {/* Agency Value Anchor */}
                                <div className="mb-4">
                                    <span className="text-sm text-muted-foreground line-through">$1,500 agency value</span>
                                </div>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold  text-foreground">${TIER_CONFIGS.standard.priceUsd}</span>
                                    <span className="text-muted-foreground ml-2">USD</span>
                                </div>

                                <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        Problem Statement Analysis
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        Top 3 Validated Opportunities
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        Quick Viability Score (1-10)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        1 Recommended Next Step
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        Instant Delivery (~5 min)
                                    </li>
                                </ul>

                                <div className="space-y-3 mt-auto">
                                    <Button
                                        onClick={(e) => handleStartClick(e, "standard")}
                                        disabled={!isProblemStatementValid || isProcessing}
                                        className="w-full btn-secondary"
                                        variant={selectedTier === 'standard' ? "default" : "outline"}
                                        size="lg"
                                    >
                                        {isProcessing ? "Processing..." : "Get Quick Validation →"}
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground text-center">Perfect for early-stage validation</p>
                                </div>
                            </div>
                        </div>

                        {/* Tier 2: Insider (Most Popular) */}
                        <div
                            className={`huly-card group order-1 md:order-2 ${selectedTier === 'medium' ? 'huly-active scale-[1.03] z-10' : 'opacity-80 hover:opacity-100'}`}
                            onClick={() => onSelectTier('medium')}
                        >
                            <div className="huly-content">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className={`w-5 h-5 ${selectedTier === 'medium' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <h3 className={`text-sm font-bold uppercase tracking-[0.1em] ${selectedTier === 'medium' ? 'text-primary' : 'text-muted-foreground'}`}>Insider</h3>
                                    </div>
                                    {selectedTier === 'medium' && (
                                        <span className="px-3 py-1.5 text-[10px] font-bold bg-primary/30 border-2 border-primary/60 rounded-full text-primary tracking-wider animate-pulse">
                                            ⭐ MOST POPULAR
                                        </span>
                                    )}
                                </div>

                                <h4 className="text-2xl font-bold mb-2 ">Strategic Roadmap</h4>
                                <p className="text-xs text-muted-foreground mb-4">The founder's playbook. From validated idea to execution plan—your entire robust defense against failure.</p>

                                {/* Agency Value Anchor */}
                                <div className="mb-4">
                                    <span className="text-sm text-muted-foreground line-through">$5,000 agency value</span>
                                </div>
                                <div className="mb-6">
                                    <span className="text-6xl font-bold  text-foreground">${TIER_CONFIGS.medium.priceUsd}</span>
                                    <span className="text-muted-foreground ml-2">USD</span>
                                </div>

                                <ul className="space-y-3 mb-6 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        <span className="font-semibold text-foreground">Everything in Observer, plus:</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        Complete Discovery & Market Analysis
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        Live Competitor Research (3-5 competitors)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        Strategic Design Roadmap
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        Week-by-Week Action Plan
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        5 Critical Risk Mitigations
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        Error Recovery Strategies
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                        Instant Delivery (~10 min)
                                    </li>
                                </ul>

                                <div className="space-y-3 mt-auto">
                                    <Button
                                        onClick={(e) => handleStartClick(e, "medium")}
                                        disabled={!isProblemStatementValid || isProcessing}
                                        className={`w-full py-6 text-lg transition-all ${selectedTier === 'medium' ? 'btn-primary shadow-lg shadow-primary/25' : 'btn-secondary'}`}
                                    >
                                        {isProcessing ? "Get Strategic Roadmap →" : "Get Strategic Roadmap →"}
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground text-center">Most popular for founders ready to build</p>
                                </div>
                            </div>
                        </div>

                        {/* Tier 3: Syndicate - APEX Tier */}
                        <div
                            className={`huly-card group order-3 ${selectedTier === 'full' ? 'huly-active scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                            onClick={() => onSelectTier('full')}
                        >
                            <div className="huly-content">
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Crown className={`w-5 h-5 ${selectedTier === 'full' ? 'text-purple-400' : 'text-muted-foreground'}`} />
                                            <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${selectedTier === 'full' ? 'text-purple-400' : 'text-muted-foreground'}`}>
                                                Syndicate
                                            </h3>
                                        </div>
                                        <span className="px-2 py-1 text-[10px] font-bold bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 tracking-wider">
                                            FULL SUITE
                                        </span>
                                    </div>

                                    <h4 className="text-xl font-bold mb-2 ">Comprehensive Spec</h4>
                                    <p className="text-xs text-muted-foreground mb-4">The agency killer. Full technical architecture, PRD, and investor-ready assets at 1/10th the cost.</p>

                                    <div className="mb-4">
                                        <span className="text-sm text-muted-foreground line-through">$15,000 agency value</span>
                                        <span className="ml-2 px-2 py-0.5 text-[10px] bg-red-500/10 text-red-400 rounded-full border border-red-500/20">90% SAVINGS</span>
                                    </div>
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold  text-foreground">${TIER_CONFIGS.full.priceUsd}</span>
                                        <span className="text-muted-foreground ml-2">USD</span>
                                    </div>

                                    <ul className="space-y-3 mb-6 text-sm">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                                            <span className="font-semibold text-foreground">Everything in Insider, plus:</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex flex-wrap items-center gap-1">"War Room" Competitor Sim<Info className="w-3 h-3 text-muted-foreground/70 sm:hidden flex-shrink-0" /><span className="text-muted-foreground text-xs hidden sm:inline">(Live counter-moves)</span></span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>We simulate what your competitors will do in the next 3 months. Not static analysis - predictive intelligence that keeps you ahead.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex flex-wrap items-center gap-1">"Fake Door" Strategy<Info className="w-3 h-3 text-muted-foreground/70 sm:hidden flex-shrink-0" /><span className="text-muted-foreground text-xs hidden sm:inline">(Validate demand first)</span></span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Validate demand BEFORE you code. Pre-order landing page + waitlist = proof that people will pay. The only real validation is a wallet opening.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex items-center gap-1">Investor Pitch Deck Outline<Info className="w-3 h-3 text-muted-foreground/70 sm:hidden flex-shrink-0" /></span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Structured outline ready for your pitch deck. Problem, solution, market size, traction, team, and ask - all backed by your validated strategy.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex items-center gap-1">Go-to-Market Launch Plan<Info className="w-3 h-3 text-muted-foreground/70 sm:hidden flex-shrink-0" /></span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Week-by-week launch roadmap with milestones, channels, and success metrics. From Phase 0 validation to full market entry.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex flex-wrap items-center gap-1">Profitability Model<Info className="w-3 h-3 text-muted-foreground/70 sm:hidden flex-shrink-0" /><span className="text-muted-foreground text-xs hidden sm:inline">(Unit Economics)</span></span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Industry-specific unit economics: Cost to Serve vs. Revenue per Customer. AI tokens, COGS, gas fees - we calculate what matters for YOUR business model.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex items-center gap-1">Full Tech Stack Architecture<Info className="w-3 h-3 text-muted-foreground/70 sm:hidden flex-shrink-0" /></span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>Complete technical blueprint: frontend, backend, database, APIs, and infrastructure. Investment-grade documentation ready for your dev team.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                                            Priority Instant Delivery (~15 min)
                                        </li>
                                    </ul>

                                    <div className="space-y-3 mt-auto">
                                        <Button
                                            onClick={(e) => handleStartClick(e, "full")}
                                            disabled={!isProblemStatementValid || isProcessing}
                                            className="w-full btn-shiny bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/50"
                                            size="lg"
                                        >
                                            {isProcessing ? "Processing..." : "Get Full Suite →"}
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground text-center">Best for technical build & fundraising</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Statement - Risk Reversal */}
                    <div className="text-center mt-12 pt-8 border-t border-border/50">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted/30 border border-border/50">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-foreground">No credit card required to see demo</span>
                            <span className="text-muted-foreground text-sm">·</span>
                            <span className="text-sm text-muted-foreground">Try before you buy</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="py-24 relative z-10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 ">
                            Compare All Features
                        </h2>
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em]">
                            Choose the right tier for your needs
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full glass-panel">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Feature</th>
                                    <th className="text-center p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Observer $49</th>
                                    <th className="text-center p-4 font-mono text-xs uppercase tracking-wider text-primary bg-primary/5">Insider $99</th>
                                    <th className="text-center p-4 font-mono text-xs uppercase tracking-wider text-purple-400">Syndicate $199</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Problem Analysis</td>
                                    <td className="p-4 text-center text-muted-foreground">Basic</td>
                                    <td className="p-4 text-center bg-primary/5">Full</td>
                                    <td className="p-4 text-center text-purple-400">Full + Research</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Pain Points</td>
                                    <td className="p-4 text-center text-muted-foreground">3</td>
                                    <td className="p-4 text-center bg-primary/5">5+</td>
                                    <td className="p-4 text-center text-purple-400">7+ validated</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Competitor Research</td>
                                    <td className="p-4 text-center text-muted-foreground">—</td>
                                    <td className="p-4 text-center bg-primary/5">3-5 live</td>
                                    <td className="p-4 text-center text-purple-400">Deep dive</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Strategic Roadmap</td>
                                    <td className="p-4 text-center text-muted-foreground">—</td>
                                    <td className="p-4 text-center bg-primary/5">Weekly</td>
                                    <td className="p-4 text-center text-purple-400">Weekly + Deps</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Risk Mitigation</td>
                                    <td className="p-4 text-center text-muted-foreground">—</td>
                                    <td className="p-4 text-center bg-primary/5">5 risks</td>
                                    <td className="p-4 text-center text-purple-400">7+ with Plan B</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Figma Prompts</td>
                                    <td className="p-4 text-center text-muted-foreground">—</td>
                                    <td className="p-4 text-center bg-primary/5">—</td>
                                    <td className="p-4 text-center text-purple-400">10 screens</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">ROI Calculation</td>
                                    <td className="p-4 text-center text-muted-foreground">—</td>
                                    <td className="p-4 text-center bg-primary/5">—</td>
                                    <td className="p-4 text-center text-purple-400">Included</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Research Citations</td>
                                    <td className="p-4 text-center text-muted-foreground">—</td>
                                    <td className="p-4 text-center bg-primary/5">Key claims</td>
                                    <td className="p-4 text-center text-purple-400">Full verification</td>
                                </tr>
                                <tr className="border-b border-border/50">
                                    <td className="p-4">Delivery</td>
                                    <td className="p-4 text-center text-muted-foreground">~5 min</td>
                                    <td className="p-4 text-center bg-primary/5">~10 min</td>
                                    <td className="p-4 text-center text-purple-400">~15 min Priority</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold">Agency Value</td>
                                    <td className="p-4 text-center text-muted-foreground line-through">$1,500</td>
                                    <td className="p-4 text-center bg-primary/5 line-through">$5,000</td>
                                    <td className="p-4 text-center text-purple-400 line-through">$15,000+</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </>
    );
}
