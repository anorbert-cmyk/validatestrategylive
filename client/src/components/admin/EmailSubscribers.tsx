import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle, Download, Mail, XCircle } from "lucide-react";
import { toast } from "sonner";

interface EmailSubscribersProps {
    subscribers: any[];
    isLoading: boolean;
    stats: {
        total: number;
        verified: number;
        unverified: number;
        verificationRate: number;
    };
}

export function EmailSubscribers({ subscribers, isLoading, stats }: EmailSubscribersProps) {

    const exportEmailsToCSV = () => {
        const headers = ["Email", "Source", "Verified", "Subscribed At", "Verified At"];
        const rows = subscribers.map(sub => [
            sub.email,
            sub.source,
            sub.isVerified ? "Yes" : "No",
            new Date(sub.subscribedAt).toISOString(),
            sub.verifiedAt ? new Date(sub.verifiedAt).toISOString() : ""
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `email-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Exported to CSV");
    };

    return (
        <Card className="admin-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                        <Mail className="h-5 w-5" />
                        Email Subscribers
                    </h2>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="font-mono">
                            Rate: {(stats?.verificationRate * 100).toFixed(1)}%
                        </Badge>
                        <Button variant="outline" size="sm" onClick={exportEmailsToCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border h-[300px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">Loading subscribers...</TableCell>
                                </TableRow>
                            ) : subscribers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No subscribers found</TableCell>
                                </TableRow>
                            ) : (
                                subscribers.map((sub: any) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.email}</TableCell>
                                        <TableCell className="text-muted-foreground">{sub.source}</TableCell>
                                        <TableCell>
                                            {sub.isVerified ? (
                                                <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-500">
                                                    <XCircle className="w-3 h-3 mr-1" /> Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(sub.subscribedAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
