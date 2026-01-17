import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpDown, Copy, DollarSign, Search, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TransactionHistoryProps {
    transactions: any[];
    isLoading: boolean;
}

export function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<"date" | "amount" | "tier">("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const formatWallet = (address: string | null | undefined) => {
        if (!address) return "—";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const filteredTransactions = transactions
        .filter((tx: any) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                tx.sessionId?.toLowerCase().includes(query) ||
                tx.walletAddress?.toLowerCase().includes(query) ||
                tx.tier?.toLowerCase().includes(query) ||
                tx.paymentMethod?.toLowerCase().includes(query)
            );
        })
        .sort((a: any, b: any) => {
            let comparison = 0;
            switch (sortField) {
                case "date":
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case "amount":
                    comparison = parseFloat(a.amountUsd) - parseFloat(b.amountUsd);
                    break;
                case "tier":
                    comparison = a.tier.localeCompare(b.tier);
                    break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });

    const toggleSort = (field: "date" | "amount" | "tier") => {
        if (sortField === field) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    return (
        <Card className="admin-card">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                        <DollarSign className="h-5 w-5" />
                        Recent Transactions
                    </h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-8 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" size="sm" onClick={() => toggleSort("date")} className="h-8 font-bold">
                                        Date <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead>Wallet / Session</TableHead>
                                <TableHead>
                                    <Button variant="ghost" size="sm" onClick={() => toggleSort("tier")} className="h-8 font-bold">
                                        Tier <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" size="sm" onClick={() => toggleSort("amount")} className="h-8 font-bold">
                                        Amount <ArrowUpDown className="ml-2 h-3 w-3" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading transactions...</TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No transactions found</TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((tx: any) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-mono text-xs">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                            <br />
                                            <span className="text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-mono">{formatWallet(tx.walletAddress)}</span>
                                                {tx.walletAddress && (
                                                    <button onClick={() => copyToClipboard(tx.walletAddress)} className="text-muted-foreground hover:text-foreground">
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-1">
                                                {tx.sessionId.slice(0, 8)}...
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`
                        ${tx.tier === 'full' ? 'border-purple-500/50 text-purple-500' :
                                                    tx.tier === 'medium' ? 'border-indigo-500/50 text-indigo-500' :
                                                        'border-emerald-500/50 text-emerald-500'}
                      `}>
                                                {tx.tier.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold">
                                                ${parseFloat(tx.amountUsd).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {tx.paymentMethod}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                                                {tx.status}
                                            </Badge>
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
