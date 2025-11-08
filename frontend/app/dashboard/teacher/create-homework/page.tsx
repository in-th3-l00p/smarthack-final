'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createHomework, createTokenTransaction } from '@/lib/supabase/queries';
import { BookOpen, Loader2, Coins, AlertCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function CreateHomeworkPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    max_students: 10,
  });

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    async function loadProfile() {
      if (!address) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (!data || data.role !== 'teacher') {
          router.push('/dashboard');
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    loadProfile();
  }, [address, isConnected, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || profile.token_balance < 1) {
      alert('You need at least 1 token to create a homework!');
      return;
    }

    setLoading(true);
    try {
      // Create homework
      const homework = await createHomework({
        teacher_id: profile.id,
        title: formData.title,
        description: formData.description,
        max_students: formData.max_students,
      });

      // Deduct 1 token
      await createTokenTransaction({
        user_id: profile.id,
        amount: -1,
        type: 'spent',
        description: `Created homework: ${formData.title}`,
      });

      alert('Homework created successfully! ✅');
      router.push('/dashboard/teacher');
    } catch (error) {
      console.error('Error creating homework:', error);
      alert('Error creating homework. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-3xl">Create New Homework</CardTitle>
            </div>
            <CardDescription>
              Publish a homework for students to enroll and ask questions
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Token Balance Display */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Your Token Balance:</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{profile.token_balance}</span>
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100 mt-2">
                Creating a homework costs <strong>1 token</strong>
              </p>
            </div>

            {/* Insufficient Tokens Warning */}
            {profile.token_balance < 1 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-900 dark:text-red-100">
                    <strong>Insufficient tokens!</strong> You need at least 1 token to create a homework.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Homework Title *</Label>
                <Input
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mathematics - Algebra Basics"
                  className="mt-2"
                  disabled={profile.token_balance < 1}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the homework, what students will learn, requirements, etc."
                  rows={6}
                  className="mt-2"
                  disabled={profile.token_balance < 1}
                />
              </div>

              <div>
                <Label htmlFor="max_students">Maximum Students *</Label>
                <Input
                  id="max_students"
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                  className="mt-2"
                  disabled={profile.token_balance < 1}
                />
                <p className="text-sm text-zinc-500 mt-2">
                  Maximum number of students who can enroll in this homework
                </p>
              </div>

              <div className="pt-4 flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || profile.token_balance < 1}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Create Homework (1 token)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
