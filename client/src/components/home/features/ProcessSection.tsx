import { Mail, CreditCard, Zap } from "lucide-react";

export function ProcessSection() {
    return (
        <section className="py-32 relative z-10 border-y border-border bg-muted/20">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

            <div className="max-w-6xl mx-auto px-4 relative">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1 mb-4">
                            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Execution Protocol</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Your Path to <span className="text-primary">Validated Success</span>
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm font-mono md:text-right max-w-xs">
                        From Vision to Strategy in 3 Simple Steps
                    </p>
                </div>

                {/* Process Grid - Technical Spec Style */}
                <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
                    {/* Step 1 */}
                    <div className="bg-card p-8 relative group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-mono font-bold text-primary">01</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-lg font-bold font-mono uppercase tracking-wide">Describe Problem</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            Write your <strong className="text-foreground">problem statement in 2-3 sentences</strong>. Be specific about your challenge, target market, or the solution you're exploring.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground">2-3 Sentences</span>
                            <span className="px-2 py-1 text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground">Be Specific</span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-card p-8 relative group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-mono font-bold text-primary">02</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-lg font-bold font-mono uppercase tracking-wide">Secure Payment</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            Choose your analysis tier and complete payment via <strong className="text-foreground">Crypto</strong>. Card payments coming soon. Your transaction is encrypted and secure.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground">SSL Encrypted</span>
                            <span className="px-2 py-1 text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground">Instant</span>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-card p-8 relative group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-mono font-bold text-primary">03</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-lg font-bold font-mono uppercase tracking-wide">AI Delivery</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            Our multi-agent AI processes your problem through <strong className="text-foreground">6 phases</strong>. Receive your report via <strong className="text-foreground">email</strong> and dashboard.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground">Real-time</span>
                            <span className="px-2 py-1 text-[10px] font-mono uppercase bg-muted border border-border text-muted-foreground">Multi-Agent</span>
                        </div>
                    </div>
                </div>

                {/* Timeline indicator */}
                <div className="mt-12 flex justify-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 border border-border bg-card">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-muted-foreground font-mono">
                            Average delivery time: <strong className="text-foreground">5-15 minutes</strong>
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
