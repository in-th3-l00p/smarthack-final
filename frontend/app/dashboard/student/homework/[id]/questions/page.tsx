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
  getQuestions,
  createQuestion,
} from '@/lib/supabase/queries';
import type { Homework, QuestionWithDetails } from '@/lib/types/database';
import { MessageCircle, Send, Loader2, CheckCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function StudentQuestionsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [myQuestions, setMyQuestions] = useState<QuestionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
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

        if (!profileData || profileData.role !== 'student') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Load homework
        const homeworkData = await getHomework(homeworkId);
        setHomework(homeworkData);

        // Load my questions on this homework
        const questionsData = await getQuestions({
          homeworkId,
          studentId: profileData.id,
        });

        setMyQuestions(questionsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router, homeworkId]);

  async function handleSubmitQuestion() {
    if (!profile || !questionText.trim()) return;

    setSubmitting(true);
    try {
      await createQuestion({
        student_id: profile.id,
        homework_id: homeworkId,
        question_text: questionText,
      });

      // Refresh questions
      const questionsData = await getQuestions({
        homeworkId,
        studentId: profile.id,
      });

      setMyQuestions(questionsData);
      setQuestionText('');
      alert('Question submitted successfully! ✅');
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Error submitting question. Please try again.');
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

  const answeredCount = myQuestions.filter(q => q.is_answered).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Questions</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Homework: <strong>{homework.title}</strong>
          </p>
          <p className="text-sm text-zinc-500">
            Teacher: {homework.teacher?.username || 'Unknown'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Total Questions</p>
                  <p className="text-3xl font-bold">{myQuestions.length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Answered</p>
                  <p className="text-3xl font-bold text-green-600">{answeredCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ask New Question */}
        <Card className="mb-8 border-blue-500">
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
            <CardDescription>
              Your teacher or a mentor will answer your question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="What would you like to know about this homework?"
                rows={4}
                className="w-full"
              />
              <Button
                onClick={handleSubmitQuestion}
                disabled={!questionText.trim() || submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Question
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Questions & Answers */}
        <div>
          <h2 className="text-2xl font-bold mb-4">My Questions & Answers</h2>
          {myQuestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="w-12 h-12 text-zinc-400 mb-4" />
                <p className="text-zinc-600">You haven't asked any questions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myQuestions.map((question) => (
                <Card
                  key={question.id}
                  className={!question.is_answered ? 'border-orange-500' : ''}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={question.is_answered ? 'default' : 'destructive'}>
                          {question.is_answered ? 'Answered' : 'Waiting for answer'}
                        </Badge>
                        <span className="text-sm text-zinc-500">
                          {new Date(question.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Question Text */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-zinc-500 mb-2">Your Question:</p>
                      <p className="whitespace-pre-wrap">{question.question_text}</p>
                    </div>

                    {/* Answers */}
                    {question.answers && question.answers.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-zinc-500">
                          Answers ({question.answers.length}):
                        </p>
                        {question.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold">
                                {answer.answerer?.username || 'Anonymous'}
                              </span>
                              <Badge variant={answer.is_from_teacher ? 'default' : 'secondary'}>
                                {answer.is_from_teacher ? 'Teacher' : 'Mentor'}
                              </Badge>
                              {!answer.is_from_teacher && answer.tokens_earned > 0 && (
                                <span className="text-xs text-zinc-500">
                                  (earned {answer.tokens_earned} tokens)
                                </span>
                              )}
                              <span className="text-xs text-zinc-500 ml-auto">
                                {new Date(answer.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm">{answer.answer_text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-500">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                        <p className="text-sm">Waiting for an answer...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
