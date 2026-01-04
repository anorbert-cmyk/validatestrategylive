/**
 * useTransactions Hook
 * Encapsulates transaction fetching, filtering, and sorting logic
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import type { AdminAuth, Transaction, SortField, SortDirection } from "../types";

interface UseTransactionsReturn {
    // Data
    transactions: Transaction[];
    filteredTransactions: Transaction[];
    isLoading: boolean;

    // Filters
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortField: SortField;
    setSortField: (field: SortField) => void;
    sortDirection: SortDirection;
    setSortDirection: (dir: SortDirection) => void;

    // Actions
    refetch: () => void;
    toggleSort: (field: SortField) => void;
}

export function useTransactions(adminAuth: AdminAuth | null): UseTransactionsReturn {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>("date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const { data, isLoading, refetch } = trpc.admin.getTransactions.useQuery(
        adminAuth
            ? { ...adminAuth, limit: 100 }
            : { signature: "", timestamp: 0, address: "", limit: 100 },
        { enabled: !!adminAuth }
    );

    const transactions = data?.transactions || [];

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter((tx) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                    tx.sessionId?.toLowerCase().includes(query) ||
                    tx.walletAddress?.toLowerCase().includes(query) ||
                    tx.tier?.toLowerCase().includes(query) ||
                    tx.paymentMethod?.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
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
    }, [transactions, searchQuery, sortField, sortDirection]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    return {
        transactions,
        filteredTransactions,
        isLoading,
        searchQuery,
        setSearchQuery,
        sortField,
        setSortField,
        sortDirection,
        setSortDirection,
        refetch,
        toggleSort,
    };
}
