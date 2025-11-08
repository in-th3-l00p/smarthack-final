'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getHomeworks, getQuestions, createAnswer } from '@/lib/supabase/queries';
import type { Homework, QuestionWithDetails } from '@/lib/types/database';
import { MessageCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function TeacherQuestionsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
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

        // Load teacher's homeworks
        const homeworksData = await getHomeworks({ teacherId: profileData.id });
        const homeworkIds = homeworksData.map(hw => hw.id);

        // Load all questions on teacher's homeworks
        const allQuestions: QuestionWithDetails[] = [];
        for (const hwId of homeworkIds) {
          const hwQuestions = await getQuestions({ homeworkId: hwId });
          allQuestions.push(...hwQuestions);
        }

        // Sort by: unanswered first, then by date
        allQuestions.sort((a, b) => {
          if (a.is_answered === b.is_answered) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return a.is_answered ? 1 : -1;
        });

        setQuestions(allQuestions);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router]);

  async function handleAnswer(questionId: string) {
    if (!answerText.trim() || !profile) return;

    setSubmitting(true);
    try {
      await createAnswer({
        question_id: questionId,
        answerer_id: profile.id,
        answer_text: answerText,
        is_from_teacher: true,
        tokens_earned: 0, // Teachers don't earn tokens for answering
      });

      // Refresh questions
      const updatedQuestions = questions.map(q => {
        if (q.id === questionId) {
          return { ...q, is_answered: true };
        }
        return q;
      });

      setQuestions(updatedQuestions);
      setAnswerText('');
      setAnsweringId(null);
      alert('Answer submitted successfully! ✅');
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Error submitting answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  const unansweredCount = questions.filter(q => !q.is_answered).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Student Questions</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Answer questions from students enrolled in your homeworks
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Total Questions</p>
                  <p className="text-3xl font-bold">{questions.length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600">Unanswered</p>
                  <p className="text-3xl font-bold text-red-600">{unansweredCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="w-12 h-12 text-zinc-400 mb-4" />
                <p className="text-zinc-600">No questions yet</p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question) => (
              <Card
                key={question.id}
                className={!question.is_answered ? 'border-blue-500' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={question.is_answered ? 'secondary' : 'default'}>
                          {question.is_answered ? 'Answered' : 'Unanswered'}
                        </Badge>
                        <span className="text-sm text-zinc-500">
                          {new Date(question.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg mb-1">
                        {question.homework?.title}
                      </CardTitle>
                      <CardDescription>
                        Asked by: <strong>{question.student?.username || 'Anonymous'}</strong>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Question Text */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg mb-4">
                    <p className="text-sm font-semibold text-zinc-500 mb-2">Question:</p>
                    <p className="whitespace-pre-wrap">{question.question_text}</p>
                  </div>

                  {/* Existing Answers */}
                  {question.answers && question.answers.length > 0 && (
                    <div className="space-y-3 mb-4">
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
                            <span className="text-xs text-zinc-500">
                              {new Date(answer.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm">{answer.answer_text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer Form */}
                  {answeringId === question.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your answer here..."
                        rows={4}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAnsweringId(null);
                            setAnswerText('');
                          }}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleAnswer(question.id)}
                          disabled={!answerText.trim() || submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant={question.is_answered ? 'outline' : 'default'}
                      onClick={() => setAnsweringId(question.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {question.is_answered ? 'Add Another Answer' : 'Answer Question'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
