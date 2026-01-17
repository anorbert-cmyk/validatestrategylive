import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    ResizableTable,
    ResizableTableBody,
    ResizableTableCell,
    ResizableTableHead,
    ResizableTableHeader,
    ResizableTableRow,
} from "@/components/ui/resizable-table";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import {
    Activity,
    CheckCircle,
    Clock,
    HelpCircle,
    Loader2,
    Pause,
    Play,
    RotateCcw,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OperationsMonitorProps {
    adminAuth: { signature: string; timestamp: number; address: string } | null;
    operationsSummary: any;
    refetchSummary: () => void;
}

export function OperationsMonitor({ adminAuth, operationsSummary, refetchSummary }: OperationsMonitorProps) {
    const [operationsFilter, setOperationsFilter] = useState<string | undefined>(undefined);
    const [operationsPage, setOperationsPage] = useState(0);
    const [operationsPageSize, setOperationsPageSize] = useState(10);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        operationId: 120,
        session: 100,
        tier: 100,
        state: 120,
        progress: 140,
        started: 160,
        actions: 120,
    });

    // Operations list query
    const {
        data: operationsData,
        isLoading: operationsLoading,
        refetch: refetchOperations,
    } = trpc.admin.getAnalysisOperations.useQuery(
        adminAuth
            ? {
                ...adminAuth,
                state: operationsFilter as any,
                limit: operationsPageSize,
                offset: operationsPage * operationsPageSize,
            }
            : { signature: "", timestamp: 0, address: "", limit: operationsPageSize, offset: 0 },
        { enabled: !!adminAuth, refetchInterval: 10000 }
    );

    // Mutations
    const pauseOperationMutation = trpc.admin.pauseOperation.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            refetchOperations();
            refetchSummary();
        },
        onError: (error) => toast.error("Failed to pause", { description: error.message }),
    });

    const resumeOperationMutation = trpc.admin.resumeOperation.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            refetchOperations();
            refetchSummary();
        },
        onError: (error) => toast.error("Failed to resume", { description: error.message }),
    });

    const cancelOperationMutation = trpc.admin.cancelOperation.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            refetchOperations();
            refetchSummary();
        },
        onError: (error) => toast.error("Failed to cancel", { description: error.message }),
    });

    const getStatusBadge = (state: string) => {
        switch (state) {
            case "completed": return <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">Completed</Badge>;
            case "failed": return <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/10">Failed</Badge>;
            case "processing": return <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10 animate-pulse">Processing</Badge>;
            case "paused": return <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 bg-yellow-500/10">Paused</Badge>;
            case "pending": return <Badge variant="outline" className="border-gray-500/30 text-gray-400 bg-gray-500/10">Pending</Badge>;
            default: return <Badge variant="outline">{state}</Badge>;
        }
    };

    const handleResize = (columnId: string, newWidth: number) => {
        setColumnWidths(prev => ({
            ...prev,
            [columnId]: newWidth
        }));
    };

    return (
        <div className="space-y-6">
            <div className="admin-section-title">
                <Activity className="w-3 h-3" />
                Operations Monitor
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-panel p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold text-blue-500">{operationsSummary?.active || 0}</p>
                    </div>
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                </Card>
                <Card className="glass-panel p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Completed (24h)</p>
                        <p className="text-2xl font-bold text-green-500">{operationsSummary?.completed || 0}</p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </Card>
                <Card className="glass-panel p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Failed (24h)</p>
                        <p className="text-2xl font-bold text-red-500">{operationsSummary?.failed || 0}</p>
                    </div>
                    <XCircle className="h-4 w-4 text-red-500" />
                </Card>
                <Card className="glass-panel p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">Avg Duration</p>
                        <p className="text-2xl font-bold">{operationsSummary?.avgDuration ? `${Math.round(operationsSummary.avgDuration / 1000)}s` : "—"}</p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </Card>
            </div>

            <Card className="admin-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Live Operations</h2>
                        <div className="flex gap-2">
                            <Button
                                variant={operationsFilter === undefined ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setOperationsFilter(undefined)}
                            >
                                All
                            </Button>
                            <Button
                                variant={operationsFilter === "processing" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setOperationsFilter("processing")}
                            >
                                Active
                            </Button>
                            <Button
                                variant={operationsFilter === "failed" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setOperationsFilter("failed")}
                            >
                                Failed
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden">
                        <ResizableTable>
                            <ResizableTableHeader>
                                <ResizableTableRow>
                                    <ResizableTableHead width={columnWidths.operationId} onResize={(w) => handleResize('operationId', w)}>ID</ResizableTableHead>
                                    <ResizableTableHead width={columnWidths.session} onResize={(w) => handleResize('session', w)}>Session</ResizableTableHead>
                                    <ResizableTableHead width={columnWidths.state} onResize={(w) => handleResize('state', w)}>State</ResizableTableHead>
                                    <ResizableTableHead width={columnWidths.progress} onResize={(w) => handleResize('progress', w)}>Progress</ResizableTableHead>
                                    <ResizableTableHead width={columnWidths.actions} onResize={(w) => handleResize('actions', w)}>Actions</ResizableTableHead>
                                </ResizableTableRow>
                            </ResizableTableHeader>
                            <ResizableTableBody>
                                {operationsLoading ? (
                                    <ResizableTableRow>
                                        <ResizableTableCell colSpan={5} className="text-center py-8">Loading...</ResizableTableCell>
                                    </ResizableTableRow>
                                ) : operationsData?.operations.length === 0 ? (
                                    <ResizableTableRow>
                                        <ResizableTableCell colSpan={5} className="text-center py-8 text-muted-foreground">No operations found</ResizableTableCell>
                                    </ResizableTableRow>
                                ) : (
                                    operationsData?.operations.map((op: any) => (
                                        <ResizableTableRow key={op.id}>
                                            <ResizableTableCell width={columnWidths.operationId} className="font-mono text-xs">{op.id.slice(0, 8)}...</ResizableTableCell>
                                            <ResizableTableCell width={columnWidths.session} className="text-xs">{op.sessionId.slice(0, 8)}...</ResizableTableCell>
                                            <ResizableTableCell width={columnWidths.state}>{getStatusBadge(op.state)}</ResizableTableCell>
                                            <ResizableTableCell width={columnWidths.progress}>
                                                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${op.progress}%` }} />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">{op.progress}% - {op.currentStep || "Initializing"}</span>
                                            </ResizableTableCell>
                                            <ResizableTableCell width={columnWidths.actions}>
                                                <div className="flex gap-1">
                                                    {op.state === 'processing' && (
                                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => pauseOperationMutation.mutate({ operationId: op.id, signature: adminAuth!.signature, timestamp: adminAuth!.timestamp, address: adminAuth!.address })}>
                                                            <Pause className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {op.state === 'paused' && (
                                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => resumeOperationMutation.mutate({ operationId: op.id, signature: adminAuth!.signature, timestamp: adminAuth!.timestamp, address: adminAuth!.address })}>
                                                            <Play className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {(op.state === 'processing' || op.state === 'paused') && (
                                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={() => cancelOperationMutation.mutate({ operationId: op.id, signature: adminAuth!.signature, timestamp: adminAuth!.timestamp, address: adminAuth!.address })}>
                                                            <XCircle className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </ResizableTableCell>
                                        </ResizableTableRow>
                                    ))
                                )}
                            </ResizableTableBody>
                        </ResizableTable>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
