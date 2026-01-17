import { useScrollReveal } from "@/hooks/useScrollReveal";

export function ComparisonSection() {
    const completeSolutionReveal = useScrollReveal<HTMLElement>();

    return (
        <section
            ref={completeSolutionReveal.ref}
            className={`py-24 relative z-10 border-y border-border bg-card/40 transition-all duration-700 ${completeSolutionReveal.isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
                }`}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1 mb-6">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Why Valid8™</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        The End-to-End <span className="text-primary">Validation Platform</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Stop juggling 5 different tools. Get everything you need in one place.
                    </p>
                </div>

                {/* Comparison Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border border-border">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground border-b border-border">Capability</th>
                                <th className="text-center p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground border-b border-border">DIY Approach</th>
                                <th className="text-center p-4 font-mono text-xs uppercase tracking-wider text-muted-foreground border-b border-border">Hire Agency</th>
                                <th className="text-center p-4 font-mono text-xs uppercase tracking-wider text-primary border-b border-border bg-primary/5">Valid8 Engine™</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors duration-200 group">
                                <td className="p-4 font-medium group-hover:text-foreground transition-colors">Market Research</td>
                                <td className="p-4 text-center text-muted-foreground">2-4 weeks</td>
                                <td className="p-4 text-center text-muted-foreground">$3,000-8,000</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-medium group-hover:bg-primary/10 transition-colors">Included</td>
                            </tr>
                            <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors duration-200 group">
                                <td className="p-4 font-medium group-hover:text-foreground transition-colors">Competitor Analysis</td>
                                <td className="p-4 text-center text-muted-foreground">1-2 weeks</td>
                                <td className="p-4 text-center text-muted-foreground">$2,000-5,000</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-medium group-hover:bg-primary/10 transition-colors">Included</td>
                            </tr>
                            <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors duration-200 group">
                                <td className="p-4 font-medium group-hover:text-foreground transition-colors">UX Strategy</td>
                                <td className="p-4 text-center text-muted-foreground">Guesswork</td>
                                <td className="p-4 text-center text-muted-foreground">$5,000-15,000</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-medium group-hover:bg-primary/10 transition-colors">Included</td>
                            </tr>
                            <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors duration-200 group">
                                <td className="p-4 font-medium group-hover:text-foreground transition-colors">Technical Architecture</td>
                                <td className="p-4 text-center text-muted-foreground">Trial & Error</td>
                                <td className="p-4 text-center text-muted-foreground">$3,000-10,000</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-medium group-hover:bg-primary/10 transition-colors">Syndicate Tier</td>
                            </tr>
                            <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors duration-200 group">
                                <td className="p-4 font-medium group-hover:text-foreground transition-colors">Risk Assessment</td>
                                <td className="p-4 text-center text-muted-foreground">Blind spots</td>
                                <td className="p-4 text-center text-muted-foreground">$2,000-5,000</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-medium group-hover:bg-primary/10 transition-colors">Included</td>
                            </tr>
                            <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors duration-200 group">
                                <td className="p-4 font-medium group-hover:text-foreground transition-colors">Go-to-Market Plan</td>
                                <td className="p-4 text-center text-muted-foreground">Ad-hoc</td>
                                <td className="p-4 text-center text-muted-foreground">$5,000-20,000</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-medium group-hover:bg-primary/10 transition-colors">Syndicate Tier</td>
                            </tr>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <td className="p-4 font-bold">Total Time</td>
                                <td className="p-4 text-center text-muted-foreground font-medium">4-8 weeks</td>
                                <td className="p-4 text-center text-muted-foreground font-medium">2-4 weeks</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-bold">5-15 minutes</td>
                            </tr>
                            <tr className="bg-muted/30">
                                <td className="p-4 font-bold">Total Cost</td>
                                <td className="p-4 text-center text-muted-foreground font-medium">Your time + opportunity cost</td>
                                <td className="p-4 text-center text-muted-foreground font-medium">$15,000-50,000+</td>
                                <td className="p-4 text-center bg-primary/5 text-primary font-bold">$49-199</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Bottom CTA */}
                <div className="mt-12 text-center">
                    <p className="text-muted-foreground mb-6">
                        Save weeks of research and thousands of dollars. Get the same insights agencies charge $15,000+ for.
                    </p>
                    <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                        See Pricing
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
