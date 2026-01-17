import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsOverview } from '../StatsOverview';

// Mock all UI imports to isolate the component
vi.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="card" className={className}>{children}</div>
    ),
    CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="card-content" className={className}>{children}</div>
    ),
    CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="card-header" className={className}>{children}</div>
    ),
}));

vi.mock('@/components/ui/skeleton', () => ({
    Skeleton: ({ className }: { className?: string }) => (
        <div data-testid="skeleton" className={className}></div>
    ),
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
        <span data-testid="badge" data-variant={variant}>{children}</span>
    ),
}));

vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
    BarChart3: () => <svg data-testid="icon-barchart3" />,
    Bitcoin: () => <svg data-testid="icon-bitcoin" />,
    DollarSign: () => <svg data-testid="icon-dollarsign" />,
    HelpCircle: () => <svg data-testid="icon-helpcircle" />,
    PieChart: () => <svg data-testid="icon-piechart" />,
    TrendingUp: () => <svg data-testid="icon-trendingup" />,
    Users: () => <svg data-testid="icon-users" />,
    Wallet: () => <svg data-testid="icon-wallet" />,
    Zap: () => <svg data-testid="icon-zap" />,
}));

/**
 * StatsOverview Component Unit Tests
 * 
 * This component is purely presentational - it receives props and renders stats.
 * No internal tRPC calls, making it easy to test.
 */
describe('StatsOverview Component', () => {
    const mockStats = {
        totalRevenueUsd: 4500,
        totalRevenueCrypto: 1.5,
        totalPurchases: 150,
        tierDistribution: {
            standard: 100,
            medium: 35,
            full: 15,
        },
        conversionFunnel: {
            sessions: 1000,
            completed: 150,
        },
    };

    const mockTxStats = {
        totalWalletPurchases: 50,
        uniqueWallets: 25,
    };

    describe('Loading State', () => {
        it('should render skeletons when isLoading is true', () => {
            render(
                <StatsOverview
                    stats={null}
                    isLoading={true}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            const skeletons = screen.getAllByTestId('skeleton');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('should render tx skeletons when isTxLoading is true', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={{ totalWalletPurchases: 0, uniqueWallets: 0 }}
                    isTxLoading={true}
                />
            );

            const skeletons = screen.getAllByTestId('skeleton');
            expect(skeletons.length).toBeGreaterThan(0);
        });
    });

    describe('Data Display', () => {
        it('should render stats cards when data is loaded', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            const cards = screen.getAllByTestId('card');
            expect(cards.length).toBeGreaterThan(0);
        });

        it('should display USD revenue with dollar sign', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            expect(screen.getByText('$4500.00')).toBeInTheDocument();
        });

        it('should display crypto revenue with ETH suffix', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            expect(screen.getByText(/1.5000 ETH/)).toBeInTheDocument();
        });

        it('should display wallet stats', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            // Unique wallets
            expect(screen.getByText('25')).toBeInTheDocument();
            // Wallet purchases
            expect(screen.getByText('50')).toBeInTheDocument();
        });

        it('should calculate and display conversion rate', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            // 150/1000 = 15%
            expect(screen.getByText('15.0%')).toBeInTheDocument();
        });

        it('should display tier distribution', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            expect(screen.getByText(/Observer/)).toBeInTheDocument();
            expect(screen.getByText(/Insider/)).toBeInTheDocument();
            expect(screen.getByText(/Syndicate/)).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle null stats gracefully', () => {
            expect(() => {
                render(
                    <StatsOverview
                        stats={null}
                        isLoading={false}
                        txStats={mockTxStats}
                        isTxLoading={false}
                    />
                );
            }).not.toThrow();
        });

        it('should handle zero values correctly', () => {
            const zeroStats = {
                totalRevenueUsd: 0,
                totalRevenueCrypto: 0,
                totalPurchases: 0,
                tierDistribution: { standard: 0, medium: 0, full: 0 },
                conversionFunnel: { sessions: 0, completed: 0 },
            };

            render(
                <StatsOverview
                    stats={zeroStats}
                    isLoading={false}
                    txStats={{ totalWalletPurchases: 0, uniqueWallets: 0 }}
                    isTxLoading={false}
                />
            );

            // Should show 0% conversion when sessions is 0
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should render all icons', () => {
            render(
                <StatsOverview
                    stats={mockStats}
                    isLoading={false}
                    txStats={mockTxStats}
                    isTxLoading={false}
                />
            );

            expect(screen.getByTestId('icon-dollarsign')).toBeInTheDocument();
            expect(screen.getByTestId('icon-bitcoin')).toBeInTheDocument();
            expect(screen.getByTestId('icon-wallet')).toBeInTheDocument();
        });
    });
});
