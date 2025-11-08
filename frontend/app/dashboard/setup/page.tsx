'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User, Loader2, Coins } from 'lucide-react';

const supabase = createSupabaseBrowserClient();

export default function SetupPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    role: 'student' as 'teacher' | 'student',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;

    setLoading(true);
    try {
      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            wallet_address: address.toLowerCase(),
            username: formData.username,
            role: formData.role,
            token_balance: 0, // Will be updated via trigger
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // If teacher, give 1000 initial tokens
      if (formData.role === 'teacher') {
        const { error: tokenError } = await supabase
          .from('token_transactions')
          .insert([
            {
              user_id: profile.id,
              amount: 1000,
              type: 'initial',
              description: 'Welcome bonus for teachers',
            },
          ]);

        if (tokenError) throw tokenError;
      }

      // If student, give 100 initial tokens
      if (formData.role === 'student') {
        const { error: tokenError } = await supabase
          .from('token_transactions')
          .insert([
            {
              user_id: profile.id,
              amount: 100,
              type: 'initial',
              description: 'Welcome bonus for students',
            },
          ]);

        if (tokenError) throw tokenError;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Error creating profile: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-3xl">Create Your Profile</CardTitle>
            </div>
            <CardDescription>
              Tell us about yourself to get started with EduChain
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter your username"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="role">I want to be a *</Label>
                <Select
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="mt-2"
                >
                  <option value="student">Student - Start learning and asking questions</option>
                  <option value="teacher">Teacher - Publish homeworks and answer questions</option>
                </Select>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Coins className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {formData.role === 'teacher' ? (
                        <strong>Teachers receive 2 free tokens to get started!</strong>
                      ) : (
                        'Students earn tokens by becoming mentors (4+ stars, 3+ completed homeworks)'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    'Create Profile & Continue'
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
