import { ArrowRight, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TemplateSelector } from "@/components/TemplateSelector";
import { useLocation } from "wouter";

interface HeroSectionProps {
    problemStatement: string;
    setProblemStatement: (value: string) => void;
    honeypot: string;
    setHoneypot: (value: string) => void;
    createSessionIsPending: boolean;
    onNavigateToDemo: () => void;
}

export function HeroSection({
    problemStatement,
    setProblemStatement,
    honeypot,
    setHoneypot,
    createSessionIsPending,
    onNavigateToDemo
}: HeroSectionProps) {

    const scrollToProtocol = () => {
        document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <>
            <section className="pt-28 pb-24 relative z-10">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.03) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

                <div className="max-w-5xl mx-auto px-4 relative">
                    {/* Status Badge */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-4 py-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Powered by Valid8 Engine™ · Results in Minutes</span>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight md:tracking-tighter mb-6 leading-tight md:leading-[0.9]">
                            <span className="block text-foreground mb-2 md:mb-0">DON'T GUESS.</span>
                            <span className="block text-primary">VALID8.</span>
                        </h1>
                    </div>

                    {/* Terminal-Style Subheadline */}
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="border border-border bg-card/50 p-4 font-mono text-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50" aria-hidden="true">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] text-muted-foreground ml-2">validate_strategy.sh</span>
                            </div>
                            <h2 className="text-muted-foreground text-base md:text-lg font-normal m-0 p-0">
                                <span className="text-primary">$</span> Get <strong className="font-medium text-foreground">boardroom-ready product strategy</strong> and <strong className="font-medium text-foreground">UX validation</strong> in <span className="text-foreground font-medium">minutes, not months</span>.
                            </h2>
                            <p className="text-muted-foreground/70 mt-2">
                                <span className="text-primary">$</span> The complete journey from idea to execution—all in one AI-powered platform.
                            </p>
                            <p className="text-muted-foreground/70 mt-1">
                                <span className="text-primary">$</span> Backed by research from <span className="text-foreground font-medium">Nielsen Norman</span> & <span className="text-foreground font-medium">Baymard Institute</span>.
                            </p>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col gap-6 items-center">
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <Button
                                onClick={scrollToProtocol}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-base font-mono uppercase tracking-wider flex items-center gap-3 group border-0"
                            >
                                <span className="text-primary-foreground/70">&gt;</span>
                                START VALIDATION
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                onClick={onNavigateToDemo}
                                variant="outline"
                                className="px-6 py-4 text-base font-mono uppercase tracking-wider flex items-center gap-2 border-2 border-border hover:border-primary/50"
                            >
                                <Eye className="w-4 h-4" />
                                VIEW DEMO
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex items-center gap-6 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500" />
                                <span>Zero-Knowledge Privacy</span>
                            </div>
                            <div className="w-px h-4 bg-border" />
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-cyan-500" />
                                <span>Research-Backed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Pipeline / Input Section */}
            <section id="protocol" className="py-32 relative z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-2  tracking-tight">
                            AI Product Validation Process
                        </h2>
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em]">
                            From Idea to Strategic Roadmap
                        </p>
                    </div>

                    {/* Input Section */}
                    <div className="max-w-2xl mx-auto mb-20 relative group">
                        {/* Decorative Glow */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur opacity-50 transition duration-1000 group-hover:opacity-75" />

                        <div className="relative glass-panel p-6">
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                        Problem Input Terminal
                                    </span>
                                </div>
                                <TemplateSelector
                                    onSelect={(template) => setProblemStatement(template)}
                                    disabled={createSessionIsPending}
                                />
                            </div>

                            <Textarea
                                id="problemInput"
                                value={problemStatement}
                                onChange={(e) => setProblemStatement(e.target.value)}
                                placeholder="// Enter your challenge here...&#10;> e.g. 'Automate my client reporting flow'&#10;> or 'Design a fintech onboarding UX'&#10;&#10;💡 Pro tip: Use 'Quick Start Templates' above for structured input!"
                                className="min-h-[180px] bg-background/50 border-border font-mono text-sm resize-none"
                            />

                            {/* Honeypot field - hidden from users, visible to bots */}
                            <input
                                type="text"
                                name="website"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                                className="absolute -left-[9999px] opacity-0 pointer-events-none"
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                            />

                            <div className="flex items-center justify-between mt-4 text-xs font-mono">
                                <span className={problemStatement.length < 200 ? "text-amber-400" : "text-green-400"}>
                                    {problemStatement.length} / 2000 characters {problemStatement.length < 200 && `(min. 200 recommended)`}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    End-to-end encrypted
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
