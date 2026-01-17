import { useRef, useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LOG_LINES = [
    { time: "00:01", level: "INFO", msg: "Initializing Valid8 Engine..." },
    { time: "00:04", level: "SYS", msg: "Loading agent swarm [6/6]" },
    { time: "00:12", level: "WARN", msg: "Competitor gap detected: Pricing model inefficient." },
    { time: "00:45", level: "SUCCESS", msg: "Strategy blueprint generated. Confidence: 94%" },
];

export function ValuePropSection() {
    const reveal = useScrollReveal<HTMLElement>();
    const [activeLogIndex, setActiveLogIndex] = useState(0);

    // Simple log typing animation
    useEffect(() => {
        if (!reveal.isVisible) return;
        const interval = setInterval(() => {
            setActiveLogIndex((prev) => (prev < LOG_LINES.length ? prev + 1 : prev));
        }, 800);
        return () => clearInterval(interval);
    }, [reveal.isVisible]);

    return (
        <section
            ref={reveal.ref}
            className={`py-24 relative border-y border-border/40 bg-background/50 backdrop-blur-sm transition-opacity duration-1000 ${reveal.isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                    {/* LEFT: The Terminal Window */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-cyan-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000" />

                        <div className="relative rounded-lg border border-border bg-[#0a0a0a] font-mono text-xs md:text-sm shadow-2xl overflow-hidden">
                            {/* Terminal Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="text-muted-foreground opacity-50">kernel.log</div>
                            </div>

                            {/* Terminal Body */}
                            <div className="p-6 h-[300px] flex flex-col gap-3 font-mono">
                                {LOG_LINES.map((line, i) => (
                                    <div
                                        key={i}
                                        className={`transition-all duration-500 ${i < activeLogIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                                            }`}
                                    >
                                        <span className="text-muted-foreground select-none">[{line.time}]</span>{" "}
                                        <span className={`
                      font-bold 
                      ${line.level === 'INFO' ? 'text-blue-400' : ''}
                      ${line.level === 'SYS' ? 'text-purple-400' : ''}
                      ${line.level === 'WARN' ? 'text-yellow-400' : ''}
                      ${line.level === 'SUCCESS' ? 'text-green-400' : ''}
                    `}>{line.level}</span>{" "}
                                        <span className="text-foreground/90">{line.msg}</span>
                                    </div>
                                ))}
                                {activeLogIndex >= LOG_LINES.length && (
                                    <div className="animate-pulse text-primary mt-2">_</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Brutalist Content List */}
                    <div className="space-y-12">
                        {[
                            {
                                id: "01",
                                title: "SWARM INTELLIGENCE",
                                desc: "Six specialized AI agents working in parallel. Not a wrapper—a complete research team."
                            },
                            {
                                id: "02",
                                title: "24-HOUR VARIANCE",
                                desc: "Agencies take 4 weeks. Valid8 takes 24 hours. Speed is the only moat left."
                            },
                            {
                                id: "03",
                                title: "STRATEGIC DEPTH",
                                desc: "We analyze 50+ data points per competitor. Pricing models, positioning gaps, and user sentiment."
                            }
                        ].map((item) => (
                            <div key={item.id} className="relative pl-8 border-l border-border/30 hover:border-primary/50 transition-colors duration-300">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-background border border-border rounded-full" />

                                <div className="font-mono text-xs text-primary mb-2 tracking-widest">
                                    {`// ${item.id}`}
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight mb-2 uppercase">
                                    {item.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed max-w-md">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
