import { CheckCircle, ShieldCheck } from "lucide-react";

export function TestimonialsSection() {
    return (
        <section className="py-32 relative z-10 border-y border-border">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

            <div className="max-w-6xl mx-auto px-4 relative">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 border border-green-500/40 bg-green-500/5 px-3 py-1 mb-4">
                            <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-green-400">Live Signal Feed</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Intercepted <span className="text-primary">Signals</span>
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm font-mono md:text-right max-w-xs">
            // What happens when you stop guessing
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
                    {/* Transmission 1 - Terminal Style */}
                    <div className="bg-card p-6 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="font-mono text-[10px] text-green-400 bg-green-500/10 px-2 py-1 border border-green-500/30">
                                SIGNAL_0x7F3A
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">01.02.2026 :: 03:42 UTC</div>
                        </div>
                        <div className="font-mono text-sm text-muted-foreground mb-4 leading-relaxed">
                            <span className="text-green-400">&gt;</span> Skeptical at first. Another AI tool, right? But the market analysis caught a competitor pivot we completely missed. <span className="text-green-400 font-medium">Saved us 3 months</span> of building the wrong thing.
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                            <div className="w-10 h-10 bg-green-500/10 border border-green-500/30 flex items-center justify-center font-bold text-green-400 font-mono text-sm">MK</div>
                            <div>
                                <div className="font-medium text-sm">Marcus K.</div>
                                <div className="text-xs text-muted-foreground font-mono">CTO @ Stealth Fintech</div>
                            </div>
                            <div className="ml-auto">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Transmission 2 */}
                    <div className="bg-card p-6 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 border border-indigo-500/30">
                                SIGNAL_0x9B2C
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">12.28.2025 :: 14:17 UTC</div>
                        </div>
                        <div className="font-mono text-sm text-muted-foreground mb-4 leading-relaxed">
                            <span className="text-indigo-400">&gt;</span> Used the Syndicate tier for our Series A pitch deck research. The competitive landscape section was <span className="text-indigo-400 font-medium">more thorough than our $15k consultant</span>. Not even joking.
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 font-mono text-sm">SL</div>
                            <div>
                                <div className="font-medium text-sm">Sarah L.</div>
                                <div className="text-xs text-muted-foreground font-mono">Founder @ [REDACTED]</div>
                            </div>
                            <div className="ml-auto">
                                <CheckCircle className="w-4 h-4 text-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Transmission 3 */}
                    <div className="bg-card p-6 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 border border-amber-500/30">
                                SIGNAL_0x4E8D
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">12.22.2025 :: 09:33 UTC</div>
                        </div>
                        <div className="font-mono text-sm text-muted-foreground mb-4 leading-relaxed">
                            <span className="text-amber-400">&gt;</span> Warning: this thing is addictive. Started with one analysis, now I run every new feature idea through it. <span className="text-amber-400 font-medium">The ROI projections are scary accurate</span>.
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 font-mono text-sm">JT</div>
                            <div>
                                <div className="font-medium text-sm">James T.</div>
                                <div className="text-xs text-muted-foreground font-mono">Product Lead @ Scale-up</div>
                            </div>
                            <div className="ml-auto">
                                <CheckCircle className="w-4 h-4 text-amber-500" />
                            </div>
                        </div>
                    </div>

                    {/* Transmission 4 */}
                    <div className="bg-card p-6 group hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="font-mono text-[10px] text-purple-400 bg-purple-500/10 px-2 py-1 border border-purple-500/30">
                                SIGNAL_0xA1F7
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">12.18.2025 :: 22:08 UTC</div>
                        </div>
                        <div className="font-mono text-sm text-muted-foreground mb-4 leading-relaxed">
                            <span className="text-purple-400">&gt;</span> Finally, an AI that doesn't just regurgitate generic advice. The technical feasibility report <span className="text-purple-400 font-medium">identified 3 critical blockers</span> our dev team hadn't considered. Worth every cent.
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 font-mono text-sm">AN</div>
                            <div>
                                <div className="font-medium text-sm">Alex N.</div>
                                <div className="text-xs text-muted-foreground font-mono">Engineering Director</div>
                            </div>
                            <div className="ml-auto">
                                <CheckCircle className="w-4 h-4 text-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verification Badge */}
                <div className="mt-12 flex justify-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 border border-border bg-card">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-muted-foreground font-mono">
                            All transmissions verified via <strong className="text-foreground">blockchain signature</strong>
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
