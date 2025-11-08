'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import Link from 'next/link';

const supabase = createSupabaseBrowserClient();

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    async function loadProfile() {
      if (!address) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, redirect to setup
          router.push('/dashboard/setup');
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [address, isConnected, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect to setup
  }

  // Redirect based on role
  if (profile.role === 'teacher') {
    router.push('/dashboard/teacher');
    return null;
  }

  if (profile.role === 'student') {
    router.push('/dashboard/student');
    return null;
  }

  return null;
}
