'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataPrivacyPanel } from '@/components/DataPrivacyPanel';
import { getProfile, updateProfile } from '@/lib/supabase/queries';
import type { Profile } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Settings as SettingsIcon } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function SettingsPage() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    role: 'student' as 'teacher' | 'student' | 'both',
  });

  useEffect(() => {
    async function loadProfile() {
      if (!address) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (data) {
          setProfile(data);
          setFormData({
            username: data.username || '',
            bio: data.bio || '',
            role: data.role || 'student',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [address]);

  async function handleSave() {
    if (!profile) return;

    setSaving(true);
    try {
      await updateProfile(profile.id, formData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-600">Please connect your wallet to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage your profile, privacy settings, and understand how your data is used
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Wallet Address</label>
              <input
                type="text"
                value={profile.wallet_address}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="both">Both (Student & Teacher)</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    username: profile.username || '',
                    bio: profile.bio || '',
                    role: profile.role || 'student',
                  });
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-green-600" />
              <CardTitle>Your Statistics</CardTitle>
            </div>
            <CardDescription>Overview of your activity and reputation</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profile.reputation_score}</div>
                <div className="text-sm text-zinc-600">Reputation</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profile.total_tasks_completed}</div>
                <div className="text-sm text-zinc-600">Tasks Completed</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{profile.total_tasks_created}</div>
                <div className="text-sm text-zinc-600">Tasks Created</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{profile.total_tasks_attempted}</div>
                <div className="text-sm text-zinc-600">Tasks Attempted</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong>How your reputation grows:</strong> Your reputation increases through active participation
                (creating or completing tasks), receiving positive ratings, and maintaining a high success rate.
                It cannot be purchased or transferred - it's earned through genuine engagement.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy Panel */}
        <DataPrivacyPanel userId={profile.id} />
      </div>
    </div>
  );
}
