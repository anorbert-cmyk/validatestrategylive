import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowUpRight,
  Plus,
  Sparkles,
  TrendingUp,
  Eye,
  ChevronRight
} from "lucide-react";

const TIER_INFO = {
  standard: { name: "Observer", badge: "tier-badge-standard", color: "text-slate-400" },
  medium: { name: "Insider", badge: "tier-badge-medium", color: "text-indigo-400" },
  full: { name: "Syndicate", badge: "tier-badge-full", color: "text-purple-400" },
};

const STATUS_CONFIG = {
  pending_payment: { icon: Clock, label: "Pending Payment", color: "text-yellow-500" },
  processing: { icon: Loader2, label: "Processing", color: "text-blue-500", animate: true },
  completed: { icon: CheckCircle2, label: "Completed", color: "text-green-500" },
  failed: { icon: AlertCircle, label: "Failed", color: "text-red-500" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);
  const [newProblemStatement, setNewProblemStatement] = useState("");
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<"medium" | "full" | null>(null);

  const { data: analyses, isLoading, refetch } = trpc.session.getMyAnalyses.useQuery();

  const createSession = trpc.session.create.useMutation({
    onSuccess: (data) => {
      setIsNewAnalysisOpen(false);
      setNewProblemStatement("");
      navigate(`/checkout/${data.sessionId}`);
    },
    onError: (error) => {
      toast.error("Failed to create session", { description: error.message });
    },
  });

  const handleNewAnalysis = (tier: "standard" | "medium" | "full") => {
    if (!newProblemStatement.trim() || newProblemStatement.length < 10) {
      toast.error("Problem statement must be at least 10 characters");
      return;
    }
    createSession.mutate({ problemStatement: newProblemStatement, tier });
  };

  const completedAnalyses = analyses?.filter(a => a.status === "completed") || [];
  const processingAnalyses = analyses?.filter(a => a.status === "processing") || [];
  const pendingAnalyses = analyses?.filter(a => a.status === "pending_payment") || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Analyses</h1>
            <p className="text-muted-foreground">
              View and manage your strategic UX analyses
            </p>
          </div>
          
          <Dialog open={isNewAnalysisOpen} onOpenChange={setIsNewAnalysisOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Start New Analysis</DialogTitle>
                <DialogDescription>
                  Describe your challenge and select an analysis tier
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="Describe your UX challenge or problem statement..."
                  className="min-h-[120px]"
                  value={newProblemStatement}
                  onChange={(e) => setNewProblemStatement(e.target.value)}
                  maxLength={5000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {newProblemStatement.length} / 5000
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4"
                    onClick={() => handleNewAnalysis("standard")}
                    disabled={createSession.isPending}
                  >
                    <span className="text-lg font-bold">$29</span>
                    <span className="text-xs text-muted-foreground">Observer</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4 border-primary/50"
                    onClick={() => handleNewAnalysis("medium")}
                    disabled={createSession.isPending}
                  >
                    <span className="text-lg font-bold">$79</span>
                    <span className="text-xs text-muted-foreground">Insider</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4"
                    onClick={() => handleNewAnalysis("full")}
                    disabled={createSession.isPending}
                  >
                    <span className="text-lg font-bold">$199</span>
                    <span className="text-xs text-muted-foreground">Syndicate</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedAnalyses.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">{processingAnalyses.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-panel">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingAnalyses.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyses List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Analyses</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-panel">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analyses && analyses.length > 0 ? (
            <div className="space-y-4">
              {analyses.map((analysis) => {
                const tierInfo = TIER_INFO[analysis.tier as keyof typeof TIER_INFO];
                const statusConfig = STATUS_CONFIG[analysis.status as keyof typeof STATUS_CONFIG];
                const StatusIcon = statusConfig?.icon || Clock;
                
                return (
                  <Card key={analysis.sessionId} className="analysis-card group">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Left: Problem & Meta */}
                        <div className="flex-1 space-y-3">
                          <p className="text-sm line-clamp-2">
                            {analysis.problemStatement}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`tier-badge ${tierInfo.badge}`}>
                              {tierInfo.name}
                            </span>
                            
                            <Badge 
                              variant="outline" 
                              className={`${statusConfig?.color} border-current/30`}
                            >
                              <StatusIcon className={`h-3 w-3 mr-1 ${analysis.status === "processing" ? "animate-spin" : ""}`} />
                              {statusConfig?.label}
                            </Badge>
                            
                            <span className="text-xs text-muted-foreground">
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                          {analysis.status === "completed" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/analysis/${analysis.sessionId}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Result
                              </Button>
                              
                              {/* Upgrade Option */}
                              {analysis.tier !== "full" && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-primary">
                                      <TrendingUp className="h-4 w-4 mr-2" />
                                      Upgrade
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Upgrade Analysis</DialogTitle>
                                      <DialogDescription>
                                        Get deeper insights with a higher tier analysis on the same problem
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                      <div className="p-4 rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground mb-2">Current Problem:</p>
                                        <p className="text-sm line-clamp-3">{analysis.problemStatement}</p>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        {analysis.tier === "standard" && (
                                          <>
                                            <Button
                                              variant="outline"
                                              className="w-full justify-between"
                                              onClick={() => {
                                                createSession.mutate({
                                                  problemStatement: analysis.problemStatement,
                                                  tier: "medium"
                                                });
                                              }}
                                              disabled={createSession.isPending}
                                            >
                                              <span>Upgrade to Insider</span>
                                              <span className="font-bold">$79</span>
                                            </Button>
                                            <Button
                                              variant="outline"
                                              className="w-full justify-between border-purple-500/50"
                                              onClick={() => {
                                                createSession.mutate({
                                                  problemStatement: analysis.problemStatement,
                                                  tier: "full"
                                                });
                                              }}
                                              disabled={createSession.isPending}
                                            >
                                              <span>Upgrade to Syndicate</span>
                                              <span className="font-bold">$199</span>
                                            </Button>
                                          </>
                                        )}
                                        {analysis.tier === "medium" && (
                                          <Button
                                            variant="outline"
                                            className="w-full justify-between border-purple-500/50"
                                            onClick={() => {
                                              createSession.mutate({
                                                problemStatement: analysis.problemStatement,
                                                tier: "full"
                                              });
                                            }}
                                            disabled={createSession.isPending}
                                          >
                                            <span>Upgrade to Syndicate</span>
                                            <span className="font-bold">$199</span>
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </>
                          )}
                          
                          {analysis.status === "pending_payment" && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/checkout/${analysis.sessionId}`)}
                            >
                              Complete Payment
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                          
                          {analysis.status === "processing" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/analysis/${analysis.sessionId}`)}
                            >
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              View Progress
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="glass-panel">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">No analyses yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Start your first analysis to get strategic UX insights
                    </p>
                  </div>
                  <Button onClick={() => setIsNewAnalysisOpen(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Your First Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
