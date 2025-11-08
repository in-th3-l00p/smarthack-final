'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkMentorEligibility, upgradToMentor } from '@/lib/supabase/queries';
import { Trophy, Award, Star, CheckCircle, Coins, Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function BecomeMentorPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    async function loadData() {
      if (!address) return;

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (!profileData || profileData.role !== 'student') {
          router.push('/dashboard');
          return;
        }

        if (profileData.is_mentor) {
          router.push('/dashboard/student');
          return;
        }

        setProfile(profileData);

        const isEligible = await checkMentorEligibility(profileData.id);
        setEligible(isEligible);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router]);

  async function handleUpgrade() {
    if (!profile) return;

    setUpgrading(true);
    try {
      await upgradToMentor(profile.id);
      alert('Congratulations! You are now a Mentor! 🎉');
      router.push('/dashboard/student');
    } catch (error: any) {
      console.error('Error upgrading to mentor:', error);
      alert(error.message || 'Error upgrading to mentor. Please try again.');
    } finally {
      setUpgrading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Become a Mentor</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Earn tokens by helping other students
          </p>
        </div>

        {/* Requirements Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mentor Requirements</CardTitle>
            <CardDescription>
              To become a mentor, you need to meet these criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 ${
                    profile.rating >= 4 ? 'text-green-600' : 'text-zinc-400'
                  }`}
                >
                  {profile.rating >= 4 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-current" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Rating of 4.0 stars or higher</p>
                    <Badge variant={profile.rating >= 4 ? 'default' : 'secondary'}>
                      <Star className="w-3 h-3 mr-1" />
                      {profile.rating.toFixed(1)}/5
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    Your current rating is based on {profile.total_reviews} reviews
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 ${
                    profile.completed_count >= 3 ? 'text-green-600' : 'text-zinc-400'
                  }`}
                >
                  {profile.completed_count >= 3 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-current" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Complete 3 or more homeworks</p>
                    <Badge variant={profile.completed_count >= 3 ? 'default' : 'secondary'}>
                      {profile.completed_count}/3
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    Shows you have experience with the platform
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card className="mb-8 border-purple-500">
          <CardHeader>
            <CardTitle>Mentor Benefits</CardTitle>
            <CardDescription>What you get as a mentor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <p className="font-semibold">Earn Tokens</p>
                  <p className="text-sm text-zinc-500">
                    Earn 0.5 tokens for every question you answer
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-semibold">Mentor Badge</p>
                  <p className="text-sm text-zinc-500">
                    Get a special mentor badge on your profile
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="font-semibold">Help Others</p>
                  <p className="text-sm text-zinc-500">
                    Answer questions from students across all homeworks
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Button */}
        {eligible ? (
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">You're Eligible!</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                  Congratulations! You meet all the requirements to become a mentor.
                </p>
                <Button
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5 mr-2" />
                      Become a Mentor Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  You don't meet the mentor requirements yet. Keep learning and improving your
                  rating!
                </p>
                <Button variant="outline" onClick={() => router.push('/dashboard/student')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
