import { Brain, Clock, Layers, Zap } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FEATURES = [
    {
        title: "Swarm Intelligence",
        description: "Not a wrapper. Six specialized AI agents debate, verify, and refine your strategy in parallel.",
        icon: Brain,
        className: "md:col-span-2",
    },
    {
        title: "24h Variance",
        description: "What takes an agency 4 weeks, Valid8 delivers in 24 hours. Speed is your only moat.",
        icon: Clock,
        className: "md:col-span-1",
    },
    {
        title: "Deep Context",
        description: "Ingests 50+ data points per competitor. We don't just read the homepage; we analyze the pricing model.",
        icon: Layers,
        className: "md:col-span-1",
    },
    {
        title: "Actionable Output",
        description: "You don't get 'feedback'. You get a 20-page strategic roadmap, user personas, and a go-to-market plan.",
        icon: Zap,
        className: "md:col-span-2",
    },
];

export function ValuePropSection() {
    const reveal = useScrollReveal<HTMLElement>();

    return (
        <section
            ref={reveal.ref}
            className={`py-24 relative overflow-hidden transition-all duration-1000 ${reveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
        >
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                        The <span className="text-primary">Valid8 Engine™</span> Deconstructed
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Stop guessing based on vibes. We built a scientific rig for product validation.
                        Here is how the engine outperforms human intuition.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FEATURES.map((feature, i) => (
                        <div
                            key={i}
                            className={`
                group relative p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm 
                hover:border-primary/50 hover:bg-card/50 transition-all duration-300
                ${feature.className}
              `}
                        >
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-primary">
                                    <feature.icon className="w-6 h-6" />
                                </div>

                                <h3 className="text-xl font-bold font-mono mb-3 tracking-tight">
                                    {feature.title}
                                </h3>

                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Stat Bar */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50 border-y border-border/50 bg-card/20 backdrop-blur-sm">
                    {[
                        { label: "Data Points", value: "50k+" },
                        { label: "Analysis Time", value: "<24h" },
                        { label: "Frameworks", value: "12+" },
                        { label: "Accuracy", value: "Verified" },
                    ].map((stat, i) => (
                        <div key={i} className="p-6 text-center">
                            <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 font-mono">
                                {stat.value}
                            </div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
