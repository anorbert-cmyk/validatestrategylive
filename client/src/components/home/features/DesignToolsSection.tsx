import { useScrollReveal } from "@/hooks/useScrollReveal";

export function DesignToolsSection() {
    const designToolsReveal = useScrollReveal<HTMLElement>();

    return (
        <section
            ref={designToolsReveal.ref}
            className={`py-24 relative z-10 bg-muted/30 transition-all duration-700 ${designToolsReveal.isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
                }`}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1 mb-6">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Workflow Integration</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Works With Your <span className="text-primary">Design Stack</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Export your validated strategy directly to the tools your team already uses.
                    </p>
                </div>

                {/* Tool Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Figma */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 38 57" fill="currentColor">
                                <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
                                <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
                                <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
                                <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
                                <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">Figma</h3>
                        <p className="text-xs text-muted-foreground">AI-ready design prompts</p>
                    </div>

                    {/* Lovable */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">Lovable</h3>
                        <p className="text-xs text-muted-foreground">AI app builder</p>
                    </div>

                    {/* Cursor */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">Cursor</h3>
                        <p className="text-xs text-muted-foreground">AI code editor</p>
                    </div>

                    {/* v0 by Vercel */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 19.5h20L12 2zm0 4l7 12H5l7-12z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">v0</h3>
                        <p className="text-xs text-muted-foreground">UI generation</p>
                    </div>

                    {/* Framer */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">Framer</h3>
                        <p className="text-xs text-muted-foreground">No-code websites</p>
                    </div>

                    {/* Linear */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.56.45-3.01 1.22-4.24L16.24 18.78C15.01 19.55 13.56 20 12 20zm6.78-3.76L7.76 5.22C8.99 4.45 10.44 4 12 4c4.42 0 8 3.58 8 8 0 1.56-.45 3.01-1.22 4.24z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">Linear</h3>
                        <p className="text-xs text-muted-foreground">Sprint planning</p>
                    </div>

                    {/* Notion */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v14h14V5H5zm2 2h4v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">Notion</h3>
                        <p className="text-xs text-muted-foreground">PRD templates</p>
                    </div>

                    {/* Markdown */}
                    <div className="group bg-card border border-border p-6 hover:border-primary/50 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95">
                        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm3 3v10h2v-5l2 3 2-3v5h2V7h-2l-2 3-2-3H5zm12 0v6h-2l3 4 3-4h-2V7h-2z" />
                            </svg>
                        </div>
                        <h3 className="font-bold mb-1">Markdown</h3>
                        <p className="text-xs text-muted-foreground">Universal export</p>
                    </div>
                </div>

                {/* Bottom Note */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        All reports export as <span className="text-foreground font-medium">Markdown</span> - paste directly into any tool.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Direct integration is on the way.
                    </p>
                </div>
            </div>
        </section>
    );
}
