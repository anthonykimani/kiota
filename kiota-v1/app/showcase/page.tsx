/**
 * Component Showcase Page
 * Demonstrates all Kiota UI components
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CurrencyDisplay } from '@/components/features/currency-display';
import { AssetBadge, AssetLabel } from '@/components/features/asset-badge';
import { ProgressBar, SegmentedProgressBar } from '@/components/features/progress-bar';
import { StatCard } from '@/components/features/stat-card';

import { AssetType } from '@/types/models/portfolio';

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Kiota Component Showcase</h1>
          <p className="text-muted-foreground">
            All UI components available for building Kiota screens
          </p>
        </div>

        <Separator />

        {/* Tabs for organization */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Components</TabsTrigger>
            <TabsTrigger value="kiota">Kiota Components</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          {/* Basic Components Tab */}
          <TabsContent value="basic" className="space-y-8 mt-6">
            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Various button styles and variants</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Status and category indicators</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
              </CardContent>
            </Card>

            {/* Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Form Inputs</CardTitle>
                <CardDescription>Text inputs and labels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input id="amount" type="number" placeholder="5,000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled">Disabled Input</Label>
                  <Input id="disabled" disabled placeholder="Cannot edit" />
                </div>
              </CardContent>
            </Card>

            {/* Progress Bars */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Indicators</CardTitle>
                <CardDescription>Loading and progress states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm mb-2">25% Complete</p>
                  <Progress value={25} />
                </div>
                <div>
                  <p className="text-sm mb-2">60% Complete</p>
                  <Progress value={60} />
                </div>
                <div>
                  <p className="text-sm mb-2">100% Complete</p>
                  <Progress value={100} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kiota Components Tab */}
          <TabsContent value="kiota" className="space-y-8 mt-6">
            {/* Currency Display */}
            <Card>
              <CardHeader>
                <CardTitle>Currency Display</CardTitle>
                <CardDescription>Show amounts in KES and USD</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">USD Primary</p>
                  <CurrencyDisplay amountUSD={2885.43} primaryCurrency="USD" />
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">KES Primary</p>
                  <CurrencyDisplay amountKES={375000} primaryCurrency="KES" />
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">USD Only (no conversion)</p>
                  <CurrencyDisplay amountUSD={1250} showBoth={false} />
                </div>
              </CardContent>
            </Card>

            {/* Asset Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Badges</CardTitle>
                <CardDescription>Asset type indicators with emojis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <AssetBadge asset={AssetType.USDM} />
                  <AssetBadge asset={AssetType.BCSPX} />
                  <AssetBadge asset={AssetType.PAXG} />
                  <AssetBadge asset={AssetType.BTC} />
                  <AssetBadge asset={AssetType.ETH} />
                  <AssetBadge asset={AssetType.OUSG} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <div><AssetLabel asset={AssetType.USDM} /></div>
                  <div><AssetLabel asset={AssetType.BCSPX} /></div>
                  <div><AssetLabel asset={AssetType.PAXG} /></div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Bars */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Bars</CardTitle>
                <CardDescription>Goal and allocation progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Goal Progress</p>
                  <ProgressBar current={2885} target={15000} />
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Portfolio Allocation</p>
                  <SegmentedProgressBar
                    segments={[
                      { value: 77.3, color: '#3B82F6', label: 'USDM (77.3%)' },
                      { value: 19.3, color: '#10B981', label: 'bCSPX (19.3%)' },
                      { value: 3.4, color: '#F59E0B', label: 'PAXG (3.4%)' },
                    ]}
                    height={12}
                  />
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      USDM 77.3%
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      bCSPX 19.3%
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      PAXG 3.4%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stat Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Stat Cards</CardTitle>
                <CardDescription>Key metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-8 mt-6">
            {/* Portfolio Card Example */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
                <CardDescription>Example of a dashboard card</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CurrencyDisplay amountUSD={2885.43} />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <AssetLabel asset={AssetType.USDM} />
                    <span className="font-medium">$2,230.49</span>
                  </div>
                  <Progress value={77.3} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <AssetLabel asset={AssetType.BCSPX} />
                    <span className="font-medium">$555.72</span>
                  </div>
                  <Progress value={19.3} className="bg-green-100" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <AssetLabel asset={AssetType.PAXG} />
                    <span className="font-medium">$99.23</span>
                  </div>
                  <Progress value={3.4} className="bg-yellow-100" />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button className="flex-1">Add Money</Button>
                  <Button variant="outline" className="flex-1">Withdraw</Button>
                </div>
              </CardContent>
            </Card>

            {/* Goal Card Example */}
            <Card>
              <CardHeader>
                <CardTitle>🏠 House Down Payment</CardTitle>
                <CardDescription>Target: Dec 2028</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <CurrencyDisplay amountUSD={2885} showBoth={false} />
                  <span className="text-sm text-muted-foreground">/ $15,000</span>
                </div>

                <ProgressBar current={2885} target={15000} showPercentage />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monthly deposit</p>
                    <p className="font-medium">$360</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Months remaining</p>
                    <p className="font-medium">35 months</p>
                  </div>
                </div>

                <Badge className="bg-green-100 text-green-800">On track ✅</Badge>

                <Button className="w-full">Add to Goal</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
