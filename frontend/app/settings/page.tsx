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
    role: 'student' as 'teacher' | 'student',
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
    return <div className="flex items-center justify-center min-h-screen gradient-bg">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4 gradient-bg min-h-screen">
        <Card className="glass-card rounded-2xl border-primary/10">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please connect your wallet to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl gradient-bg min-h-screen">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, privacy settings, and understand how your data is used
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="glass-card rounded-2xl border-primary/10 hover-lift animate-slide-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/20">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Wallet Address</label>
              <input
                type="text"
                value={profile.wallet_address}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                className="border-primary/30 hover:bg-primary/5"
                onClick={() => {
                  setFormData({
                    username: profile.username || '',
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
        <Card className="glass-card rounded-2xl border-primary/10 hover-lift animate-slide-in" style={{animationDelay: '100ms'}}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center ring-1 ring-secondary/20">
                <SettingsIcon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle>Your Statistics</CardTitle>
                <CardDescription>Overview of your activity and reputation</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 glass-card rounded-xl border-primary/10">
                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.rating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
              <div className="text-center p-4 glass-card rounded-xl border-primary/10">
                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.completed_count}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 glass-card rounded-xl border-primary/10">
                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.total_reviews}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </div>
              <div className="text-center p-4 glass-card rounded-xl border-primary/10">
                <div className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">{profile.token_balance}</div>
                <div className="text-sm text-muted-foreground">Tokens</div>
              </div>
            </div>

            <div className="mt-4 p-4 glass-card rounded-xl border-primary/20">
              <p className="text-sm">
                <strong>How your rating grows:</strong> Your rating increases through active participation,
                receiving positive reviews, and helping other students. Earn tokens by answering questions
                and completing tasks.
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
