import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Database, HelpCircle, ListRestart, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ErrorDashboardProps {
    adminAuth: { signature: string; timestamp: number; address: string } | null;
    errorDashboard: any;
    retryQueueStats: any;
    refetchErrors: () => void;
    refetchQueue: () => void;
}

export function ErrorDashboard({
    adminAuth,
    errorDashboard,
    retryQueueStats,
    refetchErrors,
    refetchQueue
}: ErrorDashboardProps) {

    const resetCircuitBreaker = trpc.admin.resetCircuitBreaker.useMutation({
        onSuccess: () => {
            toast.success("Circuit breaker reset");
            refetchErrors();
        },
        onError: (error) => toast.error("Failed to reset", { description: error.message }),
    });

    const toggleProcessor = trpc.admin.toggleRetryProcessor.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            refetchQueue();
        },
        onError: (error) => toast.error("Failed to toggle", { description: error.message }),
    });

    return (
        <div className="space-y-6">
            <div className="admin-section-title">
                <AlertTriangle className="w-3 h-3" />
                System Health & Error Recovery
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Circuit Breaker Status */}
                <Card className="admin-card border-l-4 border-l-primary">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Circuit Breaker Status
                            </h3>
                            <Badge variant={errorDashboard?.status === "closed" ? "default" : "destructive"}>
                                {errorDashboard?.status === "closed" ? "Healthy (Closed)" : "Tripped (Open)"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Failures (last window):</span>
                                <span className="font-mono">{errorDashboard?.failures || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Last Failure:</span>
                                <span className="font-mono text-xs">{errorDashboard?.lastFailure ? new Date(errorDashboard.lastFailure).toLocaleTimeString() : "None"}</span>
                            </div>
                            {errorDashboard?.status !== "closed" && (
                                <Button
                                    variant="outline"
                                    className="w-full mt-2 border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
                                    onClick={() => resetCircuitBreaker.mutate({ signature: adminAuth!.signature, timestamp: adminAuth!.timestamp, address: adminAuth!.address })}
                                >
                                    <RotateCcw className="w-3 h-3 mr-2" />
                                    Reset Circuit Breaker
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Retry Queue Stats */}
                <Card className="admin-card border-l-4 border-l-indigo-500">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ListRestart className="w-4 h-4" />
                                Retry Queue
                            </h3>
                            <Badge variant={retryQueueStats?.isProcessorRunning ? "default" : "secondary"}>
                                {retryQueueStats?.isProcessorRunning ? "Running" : "Paused"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-secondary/50 p-2 rounded">
                                    <div className="text-xs text-muted-foreground">Pending</div>
                                    <div className="font-bold">{retryQueueStats?.pending || 0}</div>
                                </div>
                                <div className="bg-secondary/50 p-2 rounded">
                                    <div className="text-xs text-muted-foreground">Processing</div>
                                    <div className="font-bold text-blue-500">{retryQueueStats?.processing || 0}</div>
                                </div>
                                <div className="bg-secondary/50 p-2 rounded">
                                    <div className="text-xs text-muted-foreground">Failed</div>
                                    <div className="font-bold text-red-500">{retryQueueStats?.failed || 0}</div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => toggleProcessor.mutate({
                                    signature: adminAuth!.signature,
                                    timestamp: adminAuth!.timestamp,
                                    address: adminAuth!.address,
                                    action: !retryQueueStats?.isProcessorRunning ? "start" : "stop"
                                })}
                            >
                                {retryQueueStats?.isProcessorRunning ? "Pause Processor" : "Resume Processor"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
