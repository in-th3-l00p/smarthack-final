'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createTask } from '@/lib/supabase/queries';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Coins, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function CreateTaskPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    tags: '',
    stakeAmount: '100',
    rewardAmount: '50',
    studentStakeRequired: '25',
    maxAttempts: '3',
    timeLimitMinutes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (!profile) {
        alert('Profile not found. Please create a profile first.');
        return;
      }

      // Create task in database
      const task = await createTask({
        teacher_id: profile.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        stake_amount: parseFloat(formData.stakeAmount),
        reward_amount: parseFloat(formData.rewardAmount),
        student_stake_required: parseFloat(formData.studentStakeRequired),
        max_attempts: parseInt(formData.maxAttempts),
        time_limit_minutes: formData.timeLimitMinutes ? parseInt(formData.timeLimitMinutes) : undefined,
        status: 'active',
      });

      // TODO: Create task on blockchain (TaskStaking contract)
      // This would involve calling the smart contract's createTask function
      // For hackathon demo, we'll just create it in the database

      alert('Task created successfully!');
      router.push('/dashboard/teacher');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Link href="/dashboard/teacher">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create New Task</CardTitle>
          <CardDescription>
            Create an educational task for students. You'll need to stake tokens based on the task quality.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium mb-2">Task Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Build a Simple Calculator with React"
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the task, requirements, and learning objectives..."
                rows={6}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Web Development, Math, Science"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty *</label>
                <select
                  required
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="react, javascript, frontend"
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Staking & Rewards */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                Staking & Rewards
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Stake (EDU) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.stakeAmount}
                    onChange={(e) => setFormData({ ...formData, stakeAmount: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Amount you stake</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Student Stake (EDU) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.studentStakeRequired}
                    onChange={(e) => setFormData({ ...formData, studentStakeRequired: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Students must stake</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reward (EDU) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Reward for completion</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                <p className="text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Your stake will be locked until the task is completed or cancelled.
                  You'll earn yield based on the success rate of students completing your task.
                </p>
              </div>
            </div>

            {/* Task Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Task Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Max Attempts *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Students can try this many times</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.timeLimitMinutes}
                    onChange={(e) => setFormData({ ...formData, timeLimitMinutes: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Leave empty for no limit</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6 border-t">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating Task...' : 'Create Task & Stake Tokens'}
              </Button>
              <Link href="/dashboard/teacher" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
