
export function Footer() {
    return (
        <footer className="py-12 relative z-10 border-t border-border">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/favicon-blue.png" alt="VS" className="h-8 w-auto object-contain" />
                        <span className="font-bold text-sm tracking-tight font-mono">ValidateStrategy</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <a href="/terms" className="hover:text-foreground transition">
                            Terms of Service
                        </a>
                        <a href="/privacy" className="hover:text-foreground transition">
                            Privacy Policy
                        </a>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        © 2026 ValidateStrategy. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
