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
import { trpc } from "@/lib/trpc";
import { Database, FileText } from "lucide-react";
import { useState } from "react";

interface LogViewerProps {
    adminAuth: { signature: string; timestamp: number; address: string } | null;
}

export function LogViewer({ adminAuth }: LogViewerProps) {
    const [logLevel, setLogLevel] = useState<'all' | 'error' | 'warn' | 'info'>('all');
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        timestamp: 160,
        level: 80,
        service: 120,
        message: 400,
    });

    const { data: logsData, isLoading: logsLoading } = trpc.admin.getLogs.useQuery(
        adminAuth
            ? { ...adminAuth, level: logLevel, limit: 100 }
            : { signature: "", timestamp: 0, address: "", level: 'all', limit: 100 },
        { enabled: !!adminAuth, refetchInterval: 5000 }
    );

    const getLogBadge = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error': return <Badge variant="destructive" className="text-[10px]">ERROR</Badge>;
            case 'warn': return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-[10px]">WARN</Badge>;
            case 'info': return <Badge variant="secondary" className="text-[10px]">INFO</Badge>;
            default: return <Badge variant="outline" className="text-[10px]">{level}</Badge>;
        }
    };

    const handleResize = (columnId: string, newWidth: number) => {
        setColumnWidths(prev => ({ ...prev, [columnId]: newWidth }));
    };

    return (
        <Card className="admin-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        System Logs
                    </h2>
                    <div className="flex gap-2">
                        {(['all', 'error', 'warn', 'info'] as const).map(level => (
                            <Button
                                key={level}
                                variant={logLevel === level ? "default" : "outline"}
                                size="sm"
                                onClick={() => setLogLevel(level)}
                                className="text-xs h-7"
                            >
                                {level.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden h-[400px] flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <ResizableTable>
                            <ResizableTableHeader>
                                <ResizableTableRow>
                                    <ResizableTableHead width={columnWidths.timestamp} onResize={(w) => handleResize('timestamp', w)}>Timestamp</ResizableTableHead>
                                    <ResizableTableHead width={columnWidths.level} onResize={(w) => handleResize('level', w)}>Level</ResizableTableHead>
                                    <ResizableTableHead width={columnWidths.service} onResize={(w) => handleResize('service', w)}>Service</ResizableTableHead>
                                    <ResizableTableHead width={columnWidths.message} onResize={(w) => handleResize('message', w)}>Message</ResizableTableHead>
                                </ResizableTableRow>
                            </ResizableTableHeader>
                            <ResizableTableBody>
                                {logsLoading ? (
                                    <ResizableTableRow>
                                        <ResizableTableCell colSpan={4} className="text-center py-8">Loading logs...</ResizableTableCell>
                                    </ResizableTableRow>
                                ) : logsData?.logs.map((log: any, i: number) => (
                                    <ResizableTableRow key={i} className="font-mono text-xs">
                                        <ResizableTableCell width={columnWidths.timestamp}>{new Date(log.timestamp).toLocaleTimeString()}</ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.level}>{getLogBadge(log.level)}</ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.service}>{log.service || '-'}</ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.message} className="whitespace-pre-wrap">{log.message}</ResizableTableCell>
                                    </ResizableTableRow>
                                ))}
                            </ResizableTableBody>
                        </ResizableTable>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
