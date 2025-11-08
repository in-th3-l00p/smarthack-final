'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHomeworks, getEnrollments, getQuestions, getSubmissions } from '@/lib/supabase/queries';
import type { Homework, Profile, Question, Submission } from '@/lib/types/database';
import { Plus, BookOpen, Users, HelpCircle, Coins, TrendingUp, FileText } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function TeacherDashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unansweredQuestions, setUnansweredQuestions] = useState<Question[]>([]);
  const [unreviewedSubmissions, setUnreviewedSubmissions] = useState<Submission[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

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

        if (!profileData || profileData.role !== 'teacher') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Load teacher's homeworks
        const homeworksData = await getHomeworks({ teacherId: profileData.id });
        setHomeworks(homeworksData);

        // Calculate total enrolled students
        let totalEnrolled = 0;
        for (const hw of homeworksData) {
          totalEnrolled += hw.current_students;
        }
        setTotalStudents(totalEnrolled);

        // Load unanswered questions on teacher's homeworks
        const homeworkIds = homeworksData.map(hw => hw.id);
        const allQuestions: Question[] = [];

        for (const hwId of homeworkIds) {
          const questions = await getQuestions({ homeworkId: hwId, isAnswered: false });
          allQuestions.push(...questions);
        }

        setUnansweredQuestions(allQuestions);

        // Load unreviewed submissions
        const allSubmissions: Submission[] = [];
        for (const hwId of homeworkIds) {
          const submissions = await getSubmissions({ homeworkId: hwId, status: 'submitted' });
          allSubmissions.push(...submissions);
        }
        setUnreviewedSubmissions(allSubmissions);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage tasks, answer questions, and review students
          </p>
        </div>
        <Link href="/dashboard/teacher/create-homework">
          <Button size="lg" disabled={profile.token_balance < 1}>
            <Plus className="w-5 h-5 mr-2" />
            Create Task
          </Button>
        </Link>
      </div>

      {/* Token Balance Warning */}
      {profile.token_balance < 1 && (
        <Card className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-600" />
              <p className="text-orange-900 dark:text-orange-100">
                <strong>Insufficient tokens!</strong> You need at least 1 token to create a task.
                Each task costs 1 token.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
            <Coins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.token_balance}</div>
            <p className="text-xs text-zinc-500">tokens available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{homeworks.length}</div>
            <p className="text-xs text-zinc-500">
              {homeworks.filter(h => h.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-zinc-500">enrolled across all tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unanswered Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unansweredQuestions.length}</div>
            <p className="text-xs text-zinc-500">
              <Link href="/dashboard/teacher/questions" className="text-blue-600 hover:underline">
                View all →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unreviewed Work</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreviewedSubmissions.length}</div>
            <p className="text-xs text-zinc-500">
              <Link href="/dashboard/teacher/submissions" className="text-blue-600 hover:underline">
                View all →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Your Rating & Votes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Reputation</CardTitle>
          <CardDescription>Based on student reviews and community votes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{profile.rating.toFixed(1)}/5</div>
              <div className="text-sm text-zinc-600">Average Rating</div>
              <div className="text-xs text-zinc-500 mt-1">
                {profile.total_reviews} {profile.total_reviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{profile.upvotes}</div>
              <div className="text-sm text-zinc-600">Upvotes</div>
              <div className="text-xs text-zinc-500 mt-1">from DAO voting</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{profile.downvotes}</div>
              <div className="text-sm text-zinc-600">Downvotes</div>
              <div className="text-xs text-zinc-500 mt-1">from DAO voting</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Tasks</h2>
        {homeworks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-zinc-400 mb-4" />
              <p className="text-zinc-600 mb-4">You haven't created any tasks yet</p>
              <Link href="/dashboard/teacher/create-homework">
                <Button disabled={profile.token_balance < 1}>
                  Create Your First Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homeworks.map((homework) => (
              <Card key={homework.id} className="hover:border-blue-500 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{homework.title}</CardTitle>
                    <Badge variant={homework.is_active ? 'default' : 'secondary'}>
                      {homework.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {homework.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Students enrolled:</span>
                      <span className="font-semibold">
                        {homework.current_students} / {homework.max_students}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link href={`/dashboard/teacher/homework/${homework.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/teacher/homework/${homework.id}/review`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full">
                          Review Students
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
