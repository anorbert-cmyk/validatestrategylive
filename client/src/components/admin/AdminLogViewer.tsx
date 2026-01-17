import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AlertCircle, AlertTriangle, RefreshCw, Search, Terminal, Sparkles, Brain } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type LogLevel = "INFO" | "WARN" | "ERROR";

interface AdminLogViewerProps {
    adminAuth: { signature: string; timestamp: number; address: string } | null;
}

export function AdminLogViewer({ adminAuth }: AdminLogViewerProps) {
    const [limit, setLimit] = useState(100);
    const [level, setLevel] = useState<LogLevel | "ALL">("ALL");
    const [search, setSearch] = useState("");

    // AI Analysis State
    const [analyzingLog, setAnalyzingLog] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{ id: string; content: string } | null>(null);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    const analyzeMutation = trpc.adminLogs.analyzeLog.useMutation({
        onSuccess: (data, variables) => {
            setAnalysisResult({
                id: variables.logMessage,
                content: data.analysis
            });
            setAnalyzingLog(null);
        },
        onError: (error) => {
            setAnalysisResult({
                id: "error",
                content: `Error: ${error.message}`
            });
            setAnalyzingLog(null);
        }
    });

    const handleAnalyze = (log: { id: string; message: string; metadata?: any }) => {
        setAnalyzingLog(log.id);
        setAnalysisResult(null);
        setIsAnalysisOpen(true);

        analyzeMutation.mutate({
            signature: adminAuth?.signature || "",
            timestamp: adminAuth?.timestamp || 0,
            address: adminAuth?.address || "",
            logMessage: log.message,
            context: log.metadata ? JSON.stringify(log.metadata) : undefined
        });
    };

    const { data, isLoading, refetch, isRefetching } = trpc.adminLogs.getLogs.useQuery(
        {
            signature: adminAuth?.signature || "",
            timestamp: adminAuth?.timestamp || 0,
            address: adminAuth?.address || "",
            limit,
            level: level === "ALL" ? undefined : level,
            search: search || undefined,
        },
        {
            enabled: !!adminAuth,
            refetchInterval: 10000,
        }
    );

    const stats = trpc.adminLogs.getStats.useQuery({
        signature: adminAuth?.signature || "",
        timestamp: adminAuth?.timestamp || 0,
        address: adminAuth?.address || "",
    }, { enabled: !!adminAuth });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{stats.data?.totalCount ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Log lines recorded</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-destructive/20 bg-destructive/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">Errors</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-destructive">{stats.data?.errorCount ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Critical failures</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-500">Warnings</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-yellow-500">{stats.data?.warningCount ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Potential issues</p>
                    </CardContent>
                </Card>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border">
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="grep search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 font-mono text-xs"
                        />
                    </div>

                    <Select value={level} onValueChange={(v) => setLevel(v as LogLevel | "ALL")}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">ALL LEVELS</SelectItem>
                            <SelectItem value="INFO">INFO</SelectItem>
                            <SelectItem value="WARN">WARN</SelectItem>
                            <SelectItem value="ERROR">ERROR</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Limit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">100 lines</SelectItem>
                            <SelectItem value="500">500 lines</SelectItem>
                            <SelectItem value="1000">1000 lines</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                        {isLoading ? "Loading..." : `${data?.logs.length || 0} entries`}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
                        Live Tail
                    </Button>
                </div>
            </div>

            {/* Terminal Log View */}
            <div className="rounded-lg border border-border bg-[#0a0a0a] shadow-inner overflow-hidden font-mono text-xs md:text-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-b border-border/20">
                    <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                    </div>
                    <div className="text-muted-foreground opacity-50 text-[10px] uppercase">server/logs/combined.log</div>
                </div>

                <div className="max-h-[600px] overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {isLoading ? (
                        <div className="space-y-2 animate-pulse">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-4 bg-muted/20 rounded w-full" />
                            ))}
                        </div>
                    ) : data?.logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No logs found matching your filters.
                        </div>
                    ) : (
                        data?.logs.map((log: any) => (
                            <div key={log.id} className="group hover:bg-white/5 p-1 rounded transition-colors break-words border-l-2 border-transparent hover:border-primary/50 pl-2">
                                <div className="flex flex-col md:flex-row md:items-start gap-2">
                                    <span className="text-muted-foreground/50 shrink-0 select-none w-[140px]">{log.timestamp}</span>

                                    <span className={`shrink-0 w-[60px] font-bold ${log.level === 'ERROR' ? 'text-red-500' :
                                        log.level === 'WARN' ? 'text-yellow-500' :
                                            'text-blue-500'
                                        }`}>
                                        {log.level}
                                    </span>

                                    <span className="text-foreground/90 flex-1 whitespace-pre-wrap">{log.message}</span>

                                    {log.level === 'ERROR' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-6 w-6 p-0 transition-all ml-2 shrink-0 ${log.autoAnalysis
                                                    ? "opacity-100 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 animate-pulse"
                                                    : "opacity-0 group-hover:opacity-100 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (log.autoAnalysis) {
                                                    // Instant open for pre-analyzed
                                                    setAnalysisResult({
                                                        id: log.message,
                                                        content: log.autoAnalysis
                                                    });
                                                    setIsAnalysisOpen(true);
                                                } else {
                                                    handleAnalyze(log);
                                                }
                                            }}
                                            title={log.autoAnalysis ? "View Auto-Diagnosis (Ready)" : "Ask Jules (AI Analysis)"}
                                        >
                                            <Brain className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                {log.metadata && (
                                    <div className="mt-1 ml-[210px] bg-black/50 p-2 rounded border border-white/10 text-muted-foreground text-[10px] overflow-x-auto">
                                        <pre>{log.metadata}</pre>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* AI Analysis Dialog */}
            <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
                <DialogContent className="max-w-2xl bg-[#0a0a0a] border-cyan-500/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-cyan-400 font-mono">
                            <Brain className="h-5 w-5" />
                            JULES_SENTINEL_V1
                        </DialogTitle>
                        <DialogDescription className="font-mono text-xs text-muted-foreground">
                            Automated Root Cause Analysis & Fix Suggestion
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {analyzingLog ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
                                    <Sparkles className="h-8 w-8 text-cyan-400 animate-spin duration-3000" />
                                </div>
                                <p className="text-sm font-mono text-cyan-400/80 animate-pulse">
                                    ANALYZING STACK TRACE...
                                </p>
                            </div>
                        ) : analysisResult ? (
                            <ScrollArea className="h-[400px] w-full rounded border border-white/10 p-4 bg-black/40">
                                <div className="font-mono text-sm whitespace-pre-wrap text-emerald-50/90 leading-relaxed">
                                    {analysisResult.content}
                                </div>
                            </ScrollArea>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
