import { useScrollReveal } from "@/hooks/useScrollReveal";

export function PhysicsSection() {
    const { ref } = useScrollReveal<HTMLElement>();

    return (
        <section ref={ref} className="py-24 relative z-10 border-y border-border bg-card/30">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

            <div className="max-w-6xl mx-auto px-4 relative">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1 mb-4">
                            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Live Metrics</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            The Physics of <span className="text-primary">Product Success</span>
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm font-mono md:text-right max-w-xs">
                        We engineered the luck out of the equation.
                    </p>
                </div>

                {/* Data Grid - Terminal Style */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
                    {/* Metric 1: Survival Rate */}
                    <div className="bg-card p-6 md:p-8 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Survival Rate</span>
                        </div>
                        <div className="text-5xl md:text-6xl font-bold font-mono tracking-tighter text-foreground mb-2">
                            3<span className="text-2xl text-primary">x</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            higher market survival probability
                        </p>
                    </div>

                    {/* Metric 2: User Retention */}
                    <div className="bg-card p-6 md:p-8 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Day-30 Retention</span>
                        </div>
                        <div className="text-5xl md:text-6xl font-bold font-mono tracking-tighter text-foreground mb-2">
                            88<span className="text-2xl text-primary">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            improvement in user stickiness
                        </p>
                    </div>

                    {/* Metric 3: Capital Efficiency */}
                    <div className="bg-card p-6 md:p-8 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Capital Efficiency</span>
                        </div>
                        <div className="text-5xl md:text-6xl font-bold font-mono tracking-tighter text-foreground mb-2">
                            <span className="text-2xl text-primary">$</span>100
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            saved for every $1 invested
                        </p>
                    </div>

                    {/* Metric 4: Speed to Learn */}
                    <div className="bg-card p-6 md:p-8 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Speed to Learn</span>
                        </div>
                        <div className="text-5xl md:text-6xl font-bold font-mono tracking-tighter text-foreground mb-2">
                            30<span className="text-2xl text-primary">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            faster loop from idea to revenue
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
