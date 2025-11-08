'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  getMentorableQuestions,
  createAnswer,
  createTokenTransaction,
} from '@/lib/supabase/queries';
import type { QuestionWithDetails } from '@/lib/types/database';
import { MessageCircle, Send, Loader2, Coins } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export default function MentorQuestionsPage() {
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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (!profileData || profileData.role !== 'student' || !profileData.is_mentor) {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Load all unanswered questions
        const questionsData = await getMentorableQuestions();
        setQuestions(questionsData);
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
      // Create answer
      await createAnswer({
        question_id: questionId,
        answerer_id: profile.id,
        answer_text: answerText,
        is_from_teacher: false,
        tokens_earned: 0.5,
      });

      // Give mentor 0.5 tokens
      await createTokenTransaction({
        user_id: profile.id,
        amount: 0.5,
        type: 'mentor_reward',
        description: 'Answered a student question as mentor',
      });

      // Refresh questions
      const questionsData = await getMentorableQuestions();
      setQuestions(questionsData);

      setAnswerText('');
      setAnsweringId(null);
      alert('Answer submitted! You earned 0.5 tokens! 🎉');
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mentor Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Answer student questions and earn tokens
          </p>
        </div>

        {/* Token Balance */}
        <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-zinc-600">Your Token Balance</p>
                  <p className="text-3xl font-bold">{profile.token_balance}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-600">Earn per answer</p>
                <p className="text-2xl font-bold text-green-600">+0.5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-600">Unanswered Questions</p>
              <p className="text-3xl font-bold">{questions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-600">Your Rating</p>
              <p className="text-3xl font-bold">{profile.rating.toFixed(1)}/5</p>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Questions to Answer</h2>
          {questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="w-12 h-12 text-zinc-400 mb-4" />
                <p className="text-zinc-600">No unanswered questions at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id} className="border-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default">Unanswered</Badge>
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
                      <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                        <Coins className="w-4 h-4" />
                        +0.5
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Question Text */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-zinc-500 mb-2">Question:</p>
                      <p className="whitespace-pre-wrap">{question.question_text}</p>
                    </div>

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
                                Submit & Earn 0.5 Tokens
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={() => setAnsweringId(question.id)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Answer this Question
                      </Button>
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
