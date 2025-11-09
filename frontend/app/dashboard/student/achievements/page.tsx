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
            <Button variant="ghost" size="sm" className="mb-4 hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/50 shadow-lg">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">My NFT Achievements</h1>
          </div>
          <p className="text-muted-foreground">
            Your collection of achievement NFT badges earned from completed tasks
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="liquid-glass rounded-2xl p-6 hover-lift">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{badges.length}</div>
              <p className="text-sm text-muted-foreground mt-2 font-medium">Total Badges</p>
            </div>
          </div>
          <div className="liquid-glass rounded-2xl p-6 hover-lift">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-secondary to-accent bg-clip-text text-transparent">
                {badges.filter(b => b.minted_at).length}
              </div>
              <p className="text-sm text-muted-foreground mt-2 font-medium">Minted on Blockchain</p>
            </div>
          </div>
          <div className="liquid-glass rounded-2xl p-6 hover-lift">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">
                {profile.completed_count || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2 font-medium">Tasks Completed</p>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        {badges.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-12 text-center hover-lift">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-6 ring-2 ring-primary/30">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">No Achievements Yet</p>
            <p className="text-muted-foreground mb-6">
              Complete tasks with 5-star ratings to earn NFT badges!
            </p>
            <Link href="/dashboard/student">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg">
                Browse Available Tasks
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge) => {
              // Detect skill from badge data
              const detectedSkill = badge.skill_verified || detectSkillFromTitle(badge.task_title);
              const badgeConfig = BADGE_CONFIGS[detectedSkill] || BADGE_CONFIGS['Web Development'];

              return (
                <div key={badge.id} className="liquid-glass rounded-3xl overflow-hidden hover-lift group">
                  <div
                    className="h-48 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(to bottom right, ${badgeConfig.colors.primary}, ${badgeConfig.colors.secondary})`
                    }}
                  >
                    <div className="text-8xl group-hover:scale-110 transition-transform">{badgeConfig.icon}</div>
                    {badge.minted_at && (
                      <div className="absolute top-3 right-3">
                        <BadgeUI className="bg-secondary shadow-lg ring-2 ring-secondary/50">Minted</BadgeUI>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-foreground line-clamp-1 mb-2">{badge.task_title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Earned on {new Date(badge.minted_at || badge.created_at).toLocaleDateString()}
                    </p>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                        <p className="font-medium text-foreground">{badge.teacher_name || 'Unknown'}</p>
                      </div>

                      {badge.minted_at ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">NFT Details</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Token ID:</span>
                              <span className="font-mono text-xs text-foreground">{badge.token_id || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Network:</span>
                              <span className="font-mono text-xs text-foreground">{badge.blockchain_network}</span>
                            </div>
                            <a
                              href={`https://sepolia.etherscan.io/address/${badge.token_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                            >
                              <span>View on Etherscan</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                          <p className="text-sm text-secondary-foreground">
                            This badge is eligible for minting but hasn't been minted yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
