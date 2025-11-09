'use client';

export const dynamic = 'force-dynamic';

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
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Wait longer for wallet to reconnect on page load
    const timer = setTimeout(() => {
      setInitialCheckDone(true);
    }, 3000); // Increased to 3 seconds to allow wallet reconnection

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect if we've waited and still not connected
    if (initialCheckDone && !isConnected) {
      router.push('/');
      return;
    }

    if (!isConnected || !address) return;

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
  }, [address, isConnected, router, initialCheckDone]);

  // Redirect based on role
  useEffect(() => {
    if (!profile) return;

    if (profile.role === 'teacher') {
      router.push('/dashboard/teacher');
    } else if (profile.role === 'student') {
      router.push('/dashboard/student');
    }
  }, [profile, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] gradient-bg">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect to setup
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] gradient-bg">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
