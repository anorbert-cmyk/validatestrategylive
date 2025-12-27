import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Loader2,
  Brain,
  Target,
  Layers,
  ChevronRight
} from "lucide-react";

const TIERS = [
  {
    id: "standard" as const,
    name: "Observer",
    price: 29,
    description: "Essential UX insights for quick validation",
    features: [
      "Single-pass AI analysis",
      "Problem statement evaluation",
      "Basic UX recommendations",
      "PDF export",
    ],
    badge: "STANDARD",
    badgeClass: "tier-badge-standard",
    popular: false,
  },
  {
    id: "medium" as const,
    name: "Insider",
    price: 79,
    description: "Comprehensive analysis with strategic insights",
    features: [
      "Enhanced AI analysis",
      "Market positioning insights",
      "Competitor landscape overview",
      "Strategic recommendations",
      "PDF export with visuals",
    ],
    badge: "MEDIUM",
    badgeClass: "tier-badge-medium",
    popular: true,
  },
  {
    id: "full" as const,
    name: "Syndicate",
    price: 199,
    description: "Full strategic analysis with 4-part deep dive",
    features: [
      "4-part sequential deep analysis",
      "Real-time streaming results",
      "Discovery & Problem Analysis",
      "Strategic Design & Roadmap",
      "AI Toolkit & Figma Prompts",
      "Risk, Metrics & Rationale",
      "Priority support",
    ],
    badge: "FULL",
    badgeClass: "tier-badge-full",
    popular: false,
  },
];

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [problemStatement, setProblemStatement] = useState("");
  const [selectedTier, setSelectedTier] = useState<"standard" | "medium" | "full" | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const createSession = trpc.session.create.useMutation({
    onSuccess: (data) => {
      navigate(`/checkout/${data.sessionId}`);
    },
    onError: (error) => {
      toast.error("Failed to create session", { description: error.message });
      setIsCreatingSession(false);
    },
  });

  const handleGetStarted = async (tier: "standard" | "medium" | "full") => {
    if (!problemStatement.trim()) {
      toast.error("Please enter your problem statement first");
      return;
    }

    if (problemStatement.length < 10) {
      toast.error("Problem statement must be at least 10 characters");
      return;
    }

    if (!isAuthenticated) {
      // Store intent and redirect to login
      sessionStorage.setItem("pendingAnalysis", JSON.stringify({ tier, problemStatement }));
      window.location.href = getLoginUrl();
      return;
    }

    setSelectedTier(tier);
    setIsCreatingSession(true);
    createSession.mutate({ problemStatement, tier });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fractal-blob fractal-blob-1 top-[10%] left-[10%]" />
        <div className="fractal-blob fractal-blob-2 top-[50%] right-[10%]" />
        <div className="fractal-blob fractal-blob-3 bottom-[10%] left-[30%]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gradient-primary">Rapid Apollo</span>
          </div>
          <nav className="flex items-center gap-4">
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <span className="text-sm text-muted-foreground">
                  {user?.name || user?.email}
                </span>
              </>
            ) : (
              <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 lg:py-32">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Strategic Analysis
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Transform Your{" "}
              <span className="text-gradient-primary">Problem Statement</span>
              {" "}Into Strategy
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get VP-level UX strategy documents in minutes. Our AI analyzes your problem 
              and delivers actionable insights powered by Perplexity's advanced reasoning.
            </p>

            {/* Problem Statement Input */}
            <div className="max-w-2xl mx-auto mt-12">
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Describe Your Challenge
                </label>
                <Textarea
                  placeholder="Example: We're a B2B SaaS startup struggling with user onboarding. Our trial-to-paid conversion is 3% and we're not sure why users drop off after the first session..."
                  className="min-h-[120px] bg-background/50 border-border/50 resize-none"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  maxLength={5000}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{problemStatement.length} / 5000 characters</span>
                  <span>Minimum 10 characters required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-20 bg-background/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Analysis Depth
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select the tier that matches your needs. Each tier provides increasingly 
              comprehensive strategic insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TIERS.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative analysis-card ${
                  tier.popular ? "border-primary/50 shadow-lg shadow-primary/10" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`tier-badge ${tier.badgeClass}`}>
                      {tier.badge}
                    </span>
                    {tier.id === "full" && (
                      <Badge variant="outline" className="text-xs">
                        <Layers className="h-3 w-3 mr-1" />
                        4-Part
                      </Badge>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription className="mt-2">{tier.description}</CardDescription>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/ analysis</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${tier.popular ? "btn-primary" : ""}`}
                    variant={tier.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleGetStarted(tier.id)}
                    disabled={isCreatingSession && selectedTier === tier.id}
                  >
                    {isCreatingSession && selectedTier === tier.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Get comprehensive analysis in minutes, not days. Our AI processes 
                your input and delivers actionable insights instantly.
              </p>
            </div>
            
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">
                Pay with credit card via Stripe or cryptocurrency via Coinbase Commerce. 
                Your data is encrypted and never shared.
              </p>
            </div>
            
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Data-Driven</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Perplexity's advanced AI with real-time web access for 
                current market insights and competitor analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 border-t border-border/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Strategy?
            </h2>
            <p className="text-muted-foreground">
              Join thousands of product leaders who use Rapid Apollo to make 
              data-driven decisions faster.
            </p>
            <Button 
              size="lg" 
              className="btn-primary"
              onClick={() => {
                document.querySelector("textarea")?.focus();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Start Your Analysis
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                © 2024 Rapid Apollo. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
