'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  getHomework,
  getEnrollments,
  getReviews,
  createReview,
  updateEnrollmentStatus,
} from '@/lib/supabase/queries';
import type { Homework, EnrollmentWithDetails, Review } from '@/lib/types/database';
import { Star, Loader2, CheckCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function ReviewStudentsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [existingReviews, setExistingReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingStudentId, setReviewingStudentId] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

        // Load homework
        const homeworkData = await getHomework(homeworkId);
        if (homeworkData.teacher_id !== profileData.id) {
          alert('You can only review students on your own homeworks!');
          router.push('/dashboard/teacher');
          return;
        }

        setHomework(homeworkData);

        // Load enrollments
        const enrollmentsData = await getEnrollments({ homeworkId });
        setEnrollments(enrollmentsData);

        // Load existing reviews
        const reviewsData = await getReviews({ homeworkId });
        setExistingReviews(reviewsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router, homeworkId]);

  async function handleSubmitReview(studentId: string, enrollmentId: string) {
    if (!profile) return;

    setSubmitting(true);
    try {
      // Create review
      await createReview({
        reviewer_id: profile.id,
        student_id: studentId,
        homework_id: homeworkId,
        stars,
        comment: comment.trim() || undefined,
      });

      // Update enrollment status to 'reviewed'
      await updateEnrollmentStatus(enrollmentId, 'reviewed');

      // Refresh reviews and enrollments
      const reviewsData = await getReviews({ homeworkId });
      setExistingReviews(reviewsData);

      const enrollmentsData = await getEnrollments({ homeworkId });
      setEnrollments(enrollmentsData);

      setReviewingStudentId(null);
      setStars(5);
      setComment('');
      alert('Review submitted successfully! ✅');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.message?.includes('duplicate')) {
        alert('You have already reviewed this student for this homework!');
      } else {
        alert('Error submitting review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || !homework) {
    return null;
  }

  const reviewedCount = existingReviews.filter(r => r.reviewer_id === profile.id).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Review Students</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Give feedback to students enrolled in: <strong>{homework.title}</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-600">Total Enrolled</p>
              <p className="text-3xl font-bold">{enrollments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-600">Reviewed by You</p>
              <p className="text-3xl font-bold text-green-600">{reviewedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600">
                {enrollments.length - reviewedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-zinc-600">No students enrolled yet</p>
              </CardContent>
            </Card>
          ) : (
            enrollments.map((enrollment) => {
              const student = enrollment.student!;
              const existingReview = existingReviews.find(
                r => r.student_id === student.id && r.reviewer_id === profile.id
              );

              return (
                <Card
                  key={enrollment.id}
                  className={existingReview ? 'border-green-500' : 'border-orange-500'}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{student.username || 'Anonymous'}</CardTitle>
                          {existingReview && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Reviewed
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Enrolled on: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-600">Student Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold">{student.rating.toFixed(1)}/5</span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {student.completed_count} completed
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Existing Review */}
                    {existingReview && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-semibold mb-2">Your Review:</p>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i <= existingReview.stars
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-zinc-300'
                              }`}
                            />
                          ))}
                        </div>
                        {existingReview.comment && (
                          <p className="text-sm whitespace-pre-wrap">{existingReview.comment}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-2">
                          Reviewed on: {new Date(existingReview.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Review Form */}
                    {!existingReview && (
                      <>
                        {reviewingStudentId === student.id ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Rating *</p>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setStars(i)}
                                    className="transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`w-8 h-8 ${
                                        i <= stars
                                          ? 'fill-yellow-500 text-yellow-500'
                                          : 'text-zinc-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 font-semibold">{stars}/5</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold mb-2">Comment (optional)</p>
                              <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Leave a comment for the student..."
                                rows={4}
                                className="w-full"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReviewingStudentId(null);
                                  setStars(5);
                                  setComment('');
                                }}
                                disabled={submitting}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleSubmitReview(student.id, enrollment.id)}
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submit Review
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button onClick={() => setReviewingStudentId(student.id)}>
                            <Star className="w-4 h-4 mr-2" />
                            Give Review
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
