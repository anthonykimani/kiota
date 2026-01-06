/**
 * Home/Landing Page
 * Entry point for the application
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CurrencyDisplay } from '@/components/features/currency-display';
import { StatCard } from '@/components/features/stat-card';
import { AssetBadge } from '@/components/features/asset-badge';
import { AssetType } from '@/types/models/portfolio';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-6xl mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6 pt-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg">
            💰
          </div>

          <h1 className="text-5xl font-bold text-gray-900">
            Kiota
          </h1>

          <p className="text-2xl text-gray-600 font-medium">
            Save Smart. Grow Wealth.
          </p>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Protect your savings from currency depreciation.
            Earn 5-10% annually in dollar-backed assets.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Get Started
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/showcase">View Components</Link>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Demo Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Live Demo</h2>
            <p className="text-muted-foreground">
              See how Kiota helps you preserve and grow your wealth
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Portfolio"
              value="$2,885.43"
              subtitle="≈ KES 375,106"
              trend={{ value: 4.7, label: 'this month' }}
            />
            <StatCard
              title="Monthly Earnings"
              value="$24.00"
              subtitle="From yield & growth"
              trend={{ value: 0.8, label: 'vs last month' }}
            />
            <StatCard
              title="Goal Progress"
              value="19.2%"
              subtitle="House Down Payment"
              trend={{ value: 3.1, label: 'this quarter' }}
            />
          </div>

          {/* Portfolio Preview */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Your Portfolio</CardTitle>
              <CardDescription>Diversified across three asset types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CurrencyDisplay amountUSD={2885.43} />

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <AssetBadge asset={AssetType.USDM} />
                  <div className="text-right">
                    <div className="font-bold">$2,230.49</div>
                    <div className="text-xs text-muted-foreground">77.3%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                  <AssetBadge asset={AssetType.BCSPX} />
                  <div className="text-right">
                    <div className="font-bold">$555.72</div>
                    <div className="text-xs text-muted-foreground">19.3%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <AssetBadge asset={AssetType.PAXG} />
                  <div className="text-right">
                    <div className="font-bold">$99.23</div>
                    <div className="text-xs text-muted-foreground">3.4%</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Add Money
                </Button>
                <Button variant="outline" className="flex-1">
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Features */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Why Kiota?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🛡️ Preserve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Protect your savings from KES depreciation with USD-backed assets earning 5% annually.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Grow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Invest in S&P 500 and gold for long-term wealth building with 10% average returns.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎓 Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Master investing with Kiota Academy's gamified lessons and AI-powered guidance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 py-12">
          <Badge variant="outline" className="mb-4">
            {process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ? (
              <span className="text-yellow-700">Using Mock Data</span>
            ) : (
              <span className="text-green-700">Live Data</span>
            )}
          </Badge>

          <p className="text-sm text-muted-foreground">
            Version 1.0.0 | Foundation Phase Complete
          </p>

          <div className="flex gap-4 justify-center text-sm">
            <Link href="/showcase" className="text-green-600 hover:underline">
              Component Showcase
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Documentation</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">GitHub</span>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            Built with 💚 for Kenya's savers
          </p>
        </div>
      </div>
    </main>
  );
}
