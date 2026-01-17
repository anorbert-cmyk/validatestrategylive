
export function ResearchSection() {
    return (
        <section className="py-32 relative z-10 border-y border-border bg-card/40 backdrop-blur-sm">
            {/* Technical Grid Background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left Column: Manifesto */}
                    <div className="lg:col-span-5 lg:sticky lg:top-32">
                        <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1 mb-8">
                            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Validation Protocol v4.0</span>
                        </div>

                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 leading-[0.9]">
                            BUILT ON<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/50">GIANTS.</span>
                        </h2>

                        <div className="space-y-6 text-lg font-light text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-6">
                            <p>
                                We don't guess. We engineer outcome certainty using frameworks derived from <span className="text-foreground font-medium">10,000+ usability studies</span>.
                            </p>
                            <p>
                                Every layout, interaction, and copy decision in our system is citations-backed, ensuring your product isn't just "designed"—it's <span className="text-foreground font-medium">calibrated for market survival</span>.
                            </p>
                        </div>

                        <div className="mt-12 flex gap-8">
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold font-mono text-foreground">15yo</span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Research Data</span>
                            </div>
                            <div className="w-px h-12 bg-border" />
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold font-mono text-foreground">99%</span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Confidence</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Tech Stack of Truth */}
                    <div className="lg:col-span-7 border border-border">
                        {/* Header Row */}
                        <div className="bg-muted/80 p-4 border-b border-border flex justify-between items-center">
                            <span className="font-mono text-[10px] uppercase text-muted-foreground">Source_ID</span>
                            <span className="font-mono text-[10px] uppercase text-muted-foreground">Application_Layer</span>
                        </div>

                        {/* Row 1: NN/g */}
                        <div className="group relative bg-card/40 hover:bg-primary/5 transition-colors duration-500 overflow-hidden">
                            <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 className="text-xl font-bold font-mono mb-2 flex items-center gap-2 text-foreground">
                                        <span className="text-primary">01</span> NIELSEN NORMAN
                                    </h3>
                                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Usability Heuristics</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        The gold standard for interaction design. We apply their 10 Usability Heuristics to every pixel.
                                    </p>
                                </div>
                                <div className="h-full border-l border-border pl-8 hidden md:flex flex-col justify-center">
                                    <span className="text-xs font-mono text-primary mb-1">IMPACT:</span>
                                    <span className="text-2xl font-bold text-foreground">Retention</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Baymard */}
                        <div className="group relative bg-card/40 hover:bg-primary/5 transition-colors duration-500 border-t border-border">
                            <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 className="text-xl font-bold font-mono mb-2 flex items-center gap-2 text-foreground">
                                        <span className="text-primary">02</span> BAYMARD INST.
                                    </h3>
                                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Checkout Optimization</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        Based on 110,000+ hours of testing. We use their layout benchmarks to maximize conversion velocity.
                                    </p>
                                </div>
                                <div className="h-full border-l border-border pl-8 hidden md:flex flex-col justify-center">
                                    <span className="text-xs font-mono text-primary mb-1">IMPACT:</span>
                                    <span className="text-2xl font-bold text-foreground">+35% Conv.</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Forrester */}
                        <div className="group relative bg-card/40 hover:bg-primary/5 transition-colors duration-500 border-t border-border">
                            <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 className="text-xl font-bold font-mono mb-2 flex items-center gap-2 text-foreground">
                                        <span className="text-primary">03</span> FORRESTER
                                    </h3>
                                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Economic Modeling</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        "Every $1 invested in UX brings $100 in return." We build financial viability into the UX architecture.
                                    </p>
                                </div>
                                <div className="h-full border-l border-border pl-8 hidden md:flex flex-col justify-center">
                                    <span className="text-xs font-mono text-primary mb-1">IMPACT:</span>
                                    <span className="text-2xl font-bold text-foreground">9,900% ROI</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 4: BJ Fogg */}
                        <div className="group relative bg-card/40 hover:bg-primary/5 transition-colors duration-500 border-t border-border">
                            <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 className="text-xl font-bold font-mono mb-2 flex items-center gap-2 text-foreground">
                                        <span className="text-primary">04</span> BJ FOGG (STANFORD)
                                    </h3>
                                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Behavioral Design</p>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        We utilize the Fogg Behavior Model (B=MAP) to ensure users have the Motivation, Ability, and Prompt to act.
                                    </p>
                                </div>
                                <div className="h-full border-l border-border pl-8 hidden md:flex flex-col justify-center">
                                    <span className="text-xs font-mono text-primary mb-1">IMPACT:</span>
                                    <span className="text-2xl font-bold text-foreground">Engagement</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
