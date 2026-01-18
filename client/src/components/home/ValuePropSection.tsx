import { useRef, useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, ShieldAlert, Target, Zap, BarChart3, Database } from "lucide-react";

// Agent Definitions - Colors chosen for WCAG AA contrast (4.5:1) in both modes
const AGENTS = [
    { id: "research", icon: Search, label: "Deep Research", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/10 dark:bg-blue-500/20", border: "border-blue-600/40 dark:border-blue-500/50" },
    { id: "market", icon: BarChart3, label: "Market Analyst", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-500/10 dark:bg-purple-500/20", border: "border-purple-600/40 dark:border-purple-500/50" },
    { id: "competitor", icon: Target, label: "Competitor Spy", color: "text-red-700 dark:text-red-400", bg: "bg-red-500/10 dark:bg-red-500/20", border: "border-red-600/40 dark:border-red-500/50" },
    { id: "tech", icon: Database, label: "Tech Auditor", color: "text-cyan-700 dark:text-cyan-400", bg: "bg-cyan-500/10 dark:bg-cyan-500/20", border: "border-cyan-600/40 dark:border-cyan-500/50" },
    { id: "user", icon: Brain, label: "User Psychology", color: "text-pink-700 dark:text-pink-400", bg: "bg-pink-500/10 dark:bg-pink-500/20", border: "border-pink-600/40 dark:border-pink-500/50" },
    { id: "risk", icon: ShieldAlert, label: "Risk Assessor", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-500/20", border: "border-amber-600/40 dark:border-amber-500/50" },
];

export function ValuePropSection() {
    const reveal = useScrollReveal<HTMLElement>();
    const [activeAgent, setActiveAgent] = useState<number | null>(null);

    // Cycling animation for active agent
    useEffect(() => {
        if (!reveal.isVisible) return;
        const interval = setInterval(() => {
            setActiveAgent((prev) => (prev === null || prev >= AGENTS.length - 1 ? 0 : prev + 1));
        }, 2000);
        return () => clearInterval(interval);
    }, [reveal.isVisible]);

    return (
        <section
            ref={reveal.ref}
            className={`py-32 relative border-y border-border bg-muted/30 dark:bg-black/40 backdrop-blur-sm overflow-hidden transition-opacity duration-1000 ${reveal.isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Background Noise/Grid */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }}
            />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* LEFT: THE NEURAL HIVE (Swarm Visual) */}
                    <div className="relative h-[500px] w-full flex items-center justify-center perspective-1000 group">

                        {/* Central Core */}
                        <div className="absolute z-20 w-32 h-32 rounded-full border border-cyan-500/30 bg-background/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center shadow-lg dark:shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-t border-cyan-500/50 dark:border-cyan-400/50"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 rounded-full border-b border-purple-500/50 dark:border-purple-400/50"
                            />
                            <div className="text-center">
                                <Zap className="w-8 h-8 text-cyan-700 dark:text-cyan-400 mx-auto mb-1 fill-cyan-500/20 dark:fill-cyan-400/20" />
                                <div className="text-[10px] uppercase tracking-widest text-cyan-800 dark:text-cyan-200 font-mono">CORE</div>
                            </div>
                        </div>

                        {/* Hexagonal Grid of Agents */}
                        <div className="absolute inset-0">
                            {AGENTS.map((agent, i) => {
                                const angle = (i * 60) * (Math.PI / 180);
                                const radius = 160; // Distance from center
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                const isActive = activeAgent === i;

                                return (
                                    <motion.div
                                        key={agent.id}
                                        className="absolute left-1/2 top-1/2"
                                        initial={{ x: 0, y: 0, opacity: 0 }}
                                        animate={{
                                            x: x - 40, // Centering offset (w-20/2)
                                            y: y - 40,
                                            opacity: 1,
                                            scale: isActive ? 1.1 : 1
                                        }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                    >
                                        {/* Connector Beam */}
                                        <svg className="absolute top-1/2 left-1/2 w-[200px] h-2 -z-10 overflow-visible"
                                            style={{
                                                transform: `translate(-50%, -50%) rotate(${i * 60 + 180}deg)`,
                                                transformOrigin: "center"
                                            }}>
                                            <line x1="100" y1="1" x2="200" y2="1" stroke="currentColor" className={`${isActive ? agent.color : "text-border"}`} strokeWidth="1" />
                                            {isActive && (
                                                <motion.circle
                                                    r="3" fill="currentColor" className={agent.color}
                                                    animate={{ cx: [200, 100], opacity: [0, 1, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                />
                                            )}
                                        </svg>

                                        {/* Agent Node */}
                                        <div
                                            className={`
                                                relative w-20 h-20 rounded-xl border backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300
                                                ${isActive ? `${agent.border} ${agent.bg} shadow-lg` : "border-border bg-muted/50 dark:bg-white/5 hover:border-border/80 dark:hover:border-white/20"}
                                            `}
                                            onMouseEnter={() => setActiveAgent(i)}
                                        >
                                            <agent.icon className={`w-6 h-6 mb-2 ${isActive ? agent.color : "text-muted-foreground"}`} />
                                            <div className={`text-[9px] uppercase font-mono tracking-tighter ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                                {agent.label}
                                            </div>

                                            {/* Status Dot */}
                                            <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500 dark:bg-green-400 animate-pulse" : "bg-muted-foreground/20"}`} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Floating HUD Elements - Decorational (AA compliant text) */}
                        <div className="absolute top-10 left-10 font-mono text-[10px] text-cyan-800/70 dark:text-cyan-400/60">
                            <div>SYS.METRICS</div>
                            <div>CPU: 12%</div>
                            <div>MEM: 4.2GB</div>
                        </div>
                        <div className="absolute bottom-10 right-10 font-mono text-[10px] text-purple-800/70 dark:text-purple-400/60 text-right">
                            <div>NET.STATUS</div>
                            <div>CONN: SECURE</div>
                            <div>LATENCY: 12ms</div>
                        </div>

                    </div>

                    {/* RIGHT: NARRATIVE CONTENT */}
                    <div className="space-y-12 pl-0 lg:pl-10">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
                                NOT A WRAPPER. <br />
                                <span className="text-cyan-700 dark:text-cyan-400">A RESEARCH TEAM.</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                                While other tools wrap a single LLM prompt, Valid8 spins up <span className="text-foreground font-medium">six specialized autonomous agents</span>. They debate, cross-reference, and validate each other's findings.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {[
                                {
                                    title: "Swarm Consensus",
                                    desc: "Agents must agree on a finding before it makes the report. Eliminates 99% of hallucinations.",
                                    icon: Zap,
                                    color: "text-cyan-700 dark:text-cyan-400"
                                },
                                {
                                    title: "24-Hour Deep Dive",
                                    desc: "The swarm runs for hours, not seconds. Visiting 50+ competitor sites, reading Reddit threads, and analyzing pricing tables.",
                                    icon: Brain,
                                    color: "text-purple-700 dark:text-purple-400"
                                },
                                {
                                    title: "Strategic Blueprint",
                                    desc: "Output isn't just text. It's a structured roadmap with specific, actionable steps to crush your competition.",
                                    icon: Target,
                                    color: "text-green-700 dark:text-green-400"
                                }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + (idx * 0.2) }}
                                    className="flex gap-4 group"
                                >
                                    <div className={`mt-1 w-10 h-10 rounded bg-muted dark:bg-[#0a0a0a] border border-border flex items-center justify-center shrink-0 group-hover:border-border/80 dark:group-hover:border-white/30 transition-colors`}>
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
