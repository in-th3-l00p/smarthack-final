'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { getBadges } from '@/lib/supabase/queries';
import type { Badge } from '@/lib/types/database';
import { Award, Trophy, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { BADGE_CONFIGS, detectSkillFromTitle } from '@/components/BadgeTemplate';

const supabase = createSupabaseBrowserClient();

export default function AchievementsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    async function loadData() {
      if (!address) return;

      try {
        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (!profileData || profileData.role !== 'student') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Load badges
        const badgesData = await getBadges({
          studentId: profileData.id,
        });
        setBadges(badgesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/student">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold">My NFT Achievements</h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Your collection of achievement NFT badges earned from completed tasks
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{badges.length}</div>
                <p className="text-sm text-zinc-600 mt-1">Total Badges</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {badges.filter(b => b.minted_at).length}
                </div>
                <p className="text-sm text-zinc-600 mt-1">Minted on Blockchain</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {profile.completed_count || 0}
                </div>
                <p className="text-sm text-zinc-600 mt-1">Tasks Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges Grid */}
        {badges.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-zinc-600 mb-2">No Achievements Yet</p>
              <p className="text-zinc-500">
                Complete tasks with 5-star ratings to earn NFT badges!
              </p>
              <Link href="/dashboard/student">
                <Button className="mt-6">Browse Available Tasks</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge) => {
              // Detect skill from badge data
              const detectedSkill = badge.skill_verified || detectSkillFromTitle(badge.task_title);
              const badgeConfig = BADGE_CONFIGS[detectedSkill] || BADGE_CONFIGS['Web Development'];

              return (
                <Card key={badge.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div
                    className="h-48 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(to bottom right, ${badgeConfig.colors.primary}, ${badgeConfig.colors.secondary})`
                    }}
                  >
                    <div className="text-8xl">{badgeConfig.icon}</div>
                    {badge.minted_at && (
                      <div className="absolute top-3 right-3">
                        <BadgeUI className="bg-green-500">Minted</BadgeUI>
                      </div>
                    )}
                  </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{badge.task_title}</CardTitle>
                  <CardDescription>
                    Earned on {new Date(badge.minted_at || badge.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-zinc-500">Teacher</p>
                      <p className="font-medium">{badge.teacher_name || 'Unknown'}</p>
                    </div>

                    {badge.minted_at ? (
                      <div>
                        <p className="text-sm text-zinc-500 mb-2">NFT Details</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600">Token ID:</span>
                            <span className="font-mono text-xs">{badge.token_id || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600">Network:</span>
                            <span className="font-mono text-xs">{badge.blockchain_network}</span>
                          </div>
                          <a
                            href={`https://sepolia.etherscan.io/address/${badge.token_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <span>View on Etherscan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          This badge is eligible for minting but hasn't been minted yet.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
