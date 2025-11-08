import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Lock, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function StakingPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Coins className="w-3 h-3 mr-1" />
            Staking Rewards
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Stake & Earn with EduChain
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Lock your tokens to earn rewards and support the education ecosystem
          </p>
        </div>

        {/* How It Works */}
        <Card className="mb-8 border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-2xl">How Staking Works</CardTitle>
            <CardDescription>
              Earn passive rewards while contributing to platform security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Lock Tokens</h3>
                <p className="text-sm text-zinc-600">
                  Lock your EDU tokens for a fixed period
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Earn Rewards</h3>
                <p className="text-sm text-zinc-600">
                  Receive staking rewards automatically
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">3. Withdraw</h3>
                <p className="text-sm text-zinc-600">
                  Unlock and withdraw after staking period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staking Tiers */}
        <h2 className="text-3xl font-bold mb-6 text-center">Staking Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:border-blue-500 transition-colors">
            <CardHeader>
              <CardTitle>Bronze</CardTitle>
              <CardDescription>30 Days Lock Period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-blue-600">5% APY</p>
                  <p className="text-sm text-zinc-500">Annual Percentage Yield</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Minimum: 10 EDU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Daily rewards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Flexible withdrawal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-purple-500 transition-colors border-2 border-purple-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Silver</CardTitle>
                  <CardDescription>90 Days Lock Period</CardDescription>
                </div>
                <Badge className="bg-purple-600">Popular</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-purple-600">12% APY</p>
                  <p className="text-sm text-zinc-500">Annual Percentage Yield</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Minimum: 50 EDU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Daily rewards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Priority support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-yellow-500 transition-colors">
            <CardHeader>
              <CardTitle>Gold</CardTitle>
              <CardDescription>180 Days Lock Period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-yellow-600">20% APY</p>
                  <p className="text-sm text-zinc-500">Annual Percentage Yield</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Minimum: 100 EDU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>Hourly rewards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    <span>VIP benefits</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Total Value Locked</p>
                  <p className="text-2xl font-bold">$2.4M</p>
                </div>
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Total Stakers</p>
                  <p className="text-2xl font-bold">12,456</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Rewards Paid</p>
                  <p className="text-2xl font-bold">$345K</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="pt-6 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Staking?</h3>
            <p className="mb-6 opacity-90">
              Connect your wallet and start earning passive rewards today
            </p>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
