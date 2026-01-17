
export function EquationSection() {
    return (
        <section className="py-32 relative z-10 overflow-hidden bg-muted/30">
            <div className="absolute inset-0 bg-[radial-gradient(#80808020_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="mb-16 md:text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 border border-primary/40 bg-background px-3 py-1 mb-6 rounded-sm">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Core Algorithm</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        The <span className="text-primary">Equation</span> of Certainty.
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Product success isn't magic. It's a calculable outcome of three variables.
                        We've solved for X.
                    </p>
                </div>

                {/* Equation Visualization */}
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-8 mb-16">
                    {/* Variable: Hypothesis */}
                    <div className="group relative">
                        <div className="w-24 h-24 md:w-40 md:h-40 bg-card border border-border flex flex-col items-center justify-center rounded-2xl hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-help z-10 relative">
                            <span className="text-4xl md:text-5xl font-mono font-bold text-foreground group-hover:text-primary transition-colors">H</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Hypothesis</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 p-3 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                            <p className="font-bold mb-1">High-Fidelity Input</p>
                            Your raw idea, refined into testable assumptions.
                        </div>
                    </div>

                    <span className="text-4xl text-muted-foreground font-light">×</span>

                    {/* Variable: Validation */}
                    <div className="group relative">
                        <div className="w-24 h-24 md:w-40 md:h-40 bg-card border border-border flex flex-col items-center justify-center rounded-2xl hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-help z-10 relative">
                            <span className="text-4xl md:text-5xl font-mono font-bold text-foreground group-hover:text-primary transition-colors">V</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Validation</span>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 p-3 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                            <p className="font-bold mb-1">Deep-Tech Analysis</p>
                            AI-driven simulations across 50+ market vectors.
                        </div>
                    </div>

                    <span className="text-4xl text-muted-foreground font-light">×</span>

                    {/* Variable: Execution */}
                    <div className="group relative">
                        <div className="w-24 h-24 md:w-40 md:h-40 bg-card border border-border flex flex-col items-center justify-center rounded-2xl hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-help z-10 relative">
                            <span className="text-4xl md:text-5xl font-mono font-bold text-foreground group-hover:text-primary transition-colors">E</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Execution</span>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 p-3 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                            <p className="font-bold mb-1">Precision Roadmap</p>
                            Step-by-step implementation plan with zero ambiguity.
                        </div>
                    </div>

                    <span className="text-4xl text-muted-foreground font-light">=</span>

                    {/* Variable: Success */}
                    <div className="relative">
                        <div className="w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center rounded-2xl shadow-lg shadow-primary/20 z-10 relative animate-pulse-slow">
                            <span className="text-4xl md:text-5xl font-mono font-bold text-primary-foreground">S</span>
                            <span className="text-[10px] uppercase tracking-widest text-primary-foreground/80 mt-2">Success</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
                    <div className="bg-card p-8 group hover:bg-muted/50 transition-colors">
                        <div className="mb-4 text-primary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Reduce Variance</h3>
                        <p className="text-sm text-muted-foreground">Eliminate the "luck factor". We replace founder intuition with data-hardened logic.</p>
                    </div>
                    <div className="bg-card p-8 group hover:bg-muted/50 transition-colors">
                        <div className="mb-4 text-primary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /></svg>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Target Lock</h3>
                        <p className="text-sm text-muted-foreground">Identify your exact ICP (Ideal Customer Profile) before writing a single line of code.</p>
                    </div>
                    <div className="bg-card p-8 group hover:bg-muted/50 transition-colors">
                        <div className="mb-4 text-primary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Maximize Yield</h3>
                        <p className="text-sm text-muted-foreground">Optimize your pricing and feature set for maximum revenue per user (ARPU).</p>
                    </div>
                </div>

            </div>
        </section>
    );
}
