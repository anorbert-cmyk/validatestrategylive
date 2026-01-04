/**
 * TransactionsTable Component
 * Searchable, sortable table of all transactions
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    ArrowUpDown,
    Copy,
    ExternalLink,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { Transaction, SortField, SortDirection } from "../types";
import { TIER_LABELS } from "../types";

interface TransactionsTableProps {
    transactions: Transaction[];
    isLoading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortField: SortField;
    sortDirection: SortDirection;
    onToggleSort: (field: SortField) => void;
}

// Helper to format wallet address
const formatWallet = (address: string | null | undefined) => {
    if (!address) return "—";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper to copy to clipboard
const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
};

export function TransactionsTable({
    transactions,
    isLoading,
    searchQuery,
    onSearchChange,
    sortField,
    sortDirection,
    onToggleSort,
}: TransactionsTableProps) {
    const getStatusBadge = (status: Transaction["status"]) => {
        switch (status) {
            case "completed":
                return (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" /> Completed
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
                        <XCircle className="h-3 w-3 mr-1" /> Failed
                    </Badge>
                );
        }
    };

    const getTierBadge = (tier: Transaction["tier"]) => {
        const colors = {
            standard: "bg-slate-500/10 text-slate-400 border-slate-500/30",
            medium: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
            full: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        };
        return <Badge className={colors[tier]}>{TIER_LABELS[tier]}</Badge>;
    };

    const SortButton = ({ field, label }: { field: SortField; label: string }) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-3"
            onClick={() => onToggleSort(field)}
        >
            {label}
            <ArrowUpDown
                className={`ml-1 h-3 w-3 ${sortField === field ? "opacity-100" : "opacity-30"}`}
            />
        </Button>
    );

    return (
        <Card className="glass-panel">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">Transactions</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No transactions found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead className="w-[180px] font-semibold text-muted-foreground">Session</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">Wallet</TableHead>
                                    <TableHead>
                                        <SortButton field="tier" label="Tier" />
                                    </TableHead>
                                    <TableHead>
                                        <SortButton field="amount" label="Amount" />
                                    </TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">Payment</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-right">
                                        <SortButton field="date" label="Date" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-1">
                                                {tx.sessionId.slice(0, 8)}...
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => copyToClipboard(tx.sessionId)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {tx.walletAddress ? (
                                                <div className="flex items-center gap-1 font-mono text-xs">
                                                    {formatWallet(tx.walletAddress)}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyToClipboard(tx.walletAddress!)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        asChild
                                                    >
                                                        <a
                                                            href={`https://etherscan.io/address/${tx.walletAddress}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getTierBadge(tx.tier)}</TableCell>
                                        <TableCell className="font-medium">${tx.amountUsd}</TableCell>
                                        <TableCell className="capitalize">{tx.paymentMethod}</TableCell>
                                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
