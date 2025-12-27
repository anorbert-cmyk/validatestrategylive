import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Streamdown } from "streamdown";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Loader2,
  CheckCircle2,
  Lightbulb,
  Target,
  Layers,
  AlertTriangle,
  TrendingUp,
  FileText
} from "lucide-react";

const TIER_INFO = {
  standard: { name: "Observer", badge: "tier-badge-standard" },
  medium: { name: "Insider", badge: "tier-badge-medium" },
  full: { name: "Syndicate", badge: "tier-badge-full" },
};

const PART_CONFIG = [
  { number: 1, name: "Discovery & Problem Analysis", icon: Target, color: "text-blue-500" },
  { number: 2, name: "Strategic Design & Roadmap", icon: Layers, color: "text-purple-500" },
  { number: 3, name: "AI Toolkit & Figma Prompts", icon: Lightbulb, color: "text-yellow-500" },
  { number: 4, name: "Risk, Metrics & Rationale", icon: AlertTriangle, color: "text-red-500" },
];

export default function AnalysisResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();

  const { data: session } = trpc.session.get.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  const { data: result, isLoading } = trpc.analysis.getResult.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId, refetchInterval: session?.status === "processing" ? 3000 : false }
  );

  const tierInfo = session ? TIER_INFO[session.tier as keyof typeof TIER_INFO] : null;
  const isMultiPart = session?.tier === "full";
  
  // Calculate progress for multi-part analysis
  const completedParts = result ? [result.part1, result.part2, result.part3, result.part4].filter(Boolean).length : 0;
  const progressPercent = isMultiPart ? (completedParts / 4) * 100 : (result?.singleResult ? 100 : 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Analysis Result</h1>
                {tierInfo && (
                  <span className={`tier-badge ${tierInfo.badge}`}>
                    {tierInfo.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {session?.status === "processing" ? "Analysis in progress..." : "Completed"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Problem Statement */}
        <Card className="glass-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Problem Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{session?.problemStatement}</p>
          </CardContent>
        </Card>

        {/* Progress (for processing) */}
        {session?.status === "processing" && (
          <Card className="glass-panel border-primary/30">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="font-medium">Analysis in Progress</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {isMultiPart ? `${completedParts}/4 parts completed` : "Processing..."}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                
                {isMultiPart && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {PART_CONFIG.map((part, i) => {
                      const partKey = `part${part.number}` as "part1" | "part2" | "part3" | "part4";
                      const isComplete = result?.[partKey];
                      const isCurrent = completedParts === i;
                      
                      return (
                        <div 
                          key={part.number}
                          className={`p-3 rounded-lg text-center ${
                            isComplete 
                              ? "bg-green-500/10 border border-green-500/30" 
                              : isCurrent
                                ? "bg-primary/10 border border-primary/30"
                                : "bg-muted/30 border border-border"
                          }`}
                        >
                          <part.icon className={`h-5 w-5 mx-auto mb-1 ${
                            isComplete ? "text-green-500" : isCurrent ? "text-primary" : "text-muted-foreground"
                          }`} />
                          <p className="text-xs font-medium truncate">{part.name.split(" ")[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            {isMultiPart ? (
              /* Multi-Part Results (Full Tier) */
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="part1" disabled={!result.part1}>Part 1</TabsTrigger>
                  <TabsTrigger value="part2" disabled={!result.part2}>Part 2</TabsTrigger>
                  <TabsTrigger value="part3" disabled={!result.part3}>Part 3</TabsTrigger>
                  <TabsTrigger value="part4" disabled={!result.part4}>Part 4</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Full Analysis Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-invert max-w-none">
                      {result.fullMarkdown ? (
                        <Streamdown>{result.fullMarkdown}</Streamdown>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p>Compiling full report...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {PART_CONFIG.map((part) => {
                  const partKey = `part${part.number}` as "part1" | "part2" | "part3" | "part4";
                  const partContent = result[partKey];
                  
                  return (
                    <TabsContent key={part.number} value={`part${part.number}`}>
                      <Card className="glass-panel">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <part.icon className={`h-5 w-5 ${part.color}`} />
                            Part {part.number}: {part.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-invert max-w-none">
                          {partContent ? (
                            <Streamdown>{partContent}</Streamdown>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                              <p>Generating this section...</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            ) : (
              /* Single Result (Standard/Medium Tier) */
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Analysis Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  {result.singleResult ? (
                    <Streamdown>{result.singleResult}</Streamdown>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Generating analysis...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upgrade CTA (for non-full tiers) */}
            {session?.tier !== "full" && session?.status === "completed" && (
              <Card className="glass-panel border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Want Deeper Insights?</h3>
                        <p className="text-sm text-muted-foreground">
                          Upgrade to Syndicate for a comprehensive 4-part analysis
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-purple-500 hover:bg-purple-600"
                      onClick={() => {
                        // Create new session with same problem but full tier
                        navigate("/");
                      }}
                    >
                      Upgrade to Full Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
