'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSubmissions, updateSubmissionStatus } from '@/lib/supabase/queries';
import type { SubmissionWithDetails } from '@/lib/types/database';
import { FileText, Download, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function TeacherSubmissionsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'reviewed'>('all');

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

        // Load all submissions for teacher's homeworks
        const { data: homeworksData } = await supabase
          .from('homeworks')
          .select('id')
          .eq('teacher_id', profileData.id);

        const homeworkIds = homeworksData?.map(hw => hw.id) || [];
        const allSubmissions: SubmissionWithDetails[] = [];

        for (const hwId of homeworkIds) {
          const subs = await getSubmissions({ homeworkId: hwId });
          allSubmissions.push(...subs);
        }

        setSubmissions(allSubmissions);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router]);

  async function handleMarkAsReviewed(submissionId: string) {
    setReviewingId(submissionId);
    try {
      await updateSubmissionStatus(submissionId, 'reviewed');

      // Reload submissions
      const { data: homeworksData } = await supabase
        .from('homeworks')
        .select('id')
        .eq('teacher_id', profile.id);

      const homeworkIds = homeworksData?.map(hw => hw.id) || [];
      const allSubmissions: SubmissionWithDetails[] = [];

      for (const hwId of homeworkIds) {
        const subs = await getSubmissions({ homeworkId: hwId });
        allSubmissions.push(...subs);
      }

      setSubmissions(allSubmissions);
      alert('Submission marked as reviewed! ✅');
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      alert('Error marking as reviewed. Please try again.');
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/teacher">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Student Submissions</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            View and download all files uploaded by your students
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({submissions.length})
          </Button>
          <Button
            variant={filter === 'submitted' ? 'default' : 'outline'}
            onClick={() => setFilter('submitted')}
          >
            Unreviewed ({submissions.filter(s => s.status === 'submitted').length})
          </Button>
          <Button
            variant={filter === 'reviewed' ? 'default' : 'outline'}
            onClick={() => setFilter('reviewed')}
          >
            Reviewed ({submissions.filter(s => s.status === 'reviewed').length})
          </Button>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-zinc-400 mb-4" />
              <p className="text-zinc-600">No submissions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:border-blue-500 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {submission.homework?.title || 'Unknown Task'}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Student:</span>
                          <span>{submission.student?.username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">File:</span>
                          <span>{submission.file_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Uploaded:</span>
                          <span>{new Date(submission.submitted_at).toLocaleString()}</span>
                        </div>
                        {submission.reviewed_at && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Reviewed:</span>
                            <span>{new Date(submission.reviewed_at).toLocaleString()}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={submission.status === 'reviewed' ? 'default' : 'secondary'}
                      className="ml-4"
                    >
                      {submission.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </a>
                    {submission.status === 'submitted' && (
                      <Button
                        className="flex-1"
                        onClick={() => handleMarkAsReviewed(submission.id)}
                        disabled={reviewingId === submission.id}
                      >
                        {reviewingId === submission.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Reviewed
                          </>
                        )}
                      </Button>
                    )}
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
