'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createVote, updateVote, deleteVote } from '@/lib/supabase/queries';
import { ThumbsUp, ThumbsDown, Users, TrendingUp, Star, Search } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

interface UserWithVote {
  id: string;
  username?: string;
  role: 'student' | 'teacher';
  rating: number;
  upvotes: number;
  downvotes: number;
  is_mentor: boolean;
  completed_count: number;
  myVote?: 'upvote' | 'downvote' | null;
}

export default function DAOPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<UserWithVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');

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

        if (!profileData) {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        // Load all users (excluding self)
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', profileData.id);

        // Load my votes
        const { data: votesData } = await supabase
          .from('votes')
          .select('*')
          .eq('voter_id', profileData.id);

        const usersWithVotes: UserWithVote[] = (usersData || []).map((user: any) => {
          const myVote = votesData?.find(v => v.voted_for_id === user.id);
          return {
            ...user,
            myVote: myVote?.vote_type || null,
          };
        });

        setUsers(usersWithVotes);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [address, isConnected, router]);

  async function handleVote(userId: string, voteType: 'upvote' | 'downvote') {
    if (!profile) return;

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      if (user.myVote === voteType) {
        // Remove vote if clicking same button
        await deleteVote(profile.id, userId);
        setUsers(users.map(u =>
          u.id === userId
            ? {
                ...u,
                myVote: null,
                upvotes: voteType === 'upvote' ? u.upvotes - 1 : u.upvotes,
                downvotes: voteType === 'downvote' ? u.downvotes - 1 : u.downvotes,
              }
            : u
        ));
      } else if (user.myVote) {
        // Update existing vote
        await updateVote(profile.id, userId, voteType);
        setUsers(users.map(u =>
          u.id === userId
            ? {
                ...u,
                myVote: voteType,
                upvotes: voteType === 'upvote' ? u.upvotes + 1 : u.upvotes - 1,
                downvotes: voteType === 'downvote' ? u.downvotes + 1 : u.downvotes - 1,
              }
            : u
        ));
      } else {
        // Create new vote
        await createVote({
          voter_id: profile.id,
          voted_for_id: userId,
          vote_type: voteType,
          voter_role: profile.role,
        });
        setUsers(users.map(u =>
          u.id === userId
            ? {
                ...u,
                myVote: voteType,
                upvotes: voteType === 'upvote' ? u.upvotes + 1 : u.upvotes,
                downvotes: voteType === 'downvote' ? u.downvotes + 1 : u.downvotes,
              }
            : u
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error submitting vote. Please try again.');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return null;
  }

  const filteredUsers = users
    .filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (searchTerm && !u.username?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">DAO Governance</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Vote on community members to influence reputation
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={roleFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('all')}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={roleFilter === 'student' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('student')}
              className="flex-1"
            >
              Students
            </Button>
            <Button
              variant={roleFilter === 'teacher' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('teacher')}
              className="flex-1"
            >
              Teachers
            </Button>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-zinc-400 mb-4" />
                <p className="text-zinc-600">No users found</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:border-blue-500 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                        {user.username?.charAt(0).toUpperCase() || '?'}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {user.username || 'Anonymous'}
                          </h3>
                          <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                          {user.is_mentor && (
                            <Badge className="bg-purple-600">Mentor</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-zinc-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-600" />
                            <span>{user.rating.toFixed(1)}/5</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{user.completed_count} completed</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Upvotes / Downvotes Display */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {user.upvotes}
                        </div>
                        <div className="text-xs text-zinc-500">upvotes</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {user.downvotes}
                        </div>
                        <div className="text-xs text-zinc-500">downvotes</div>
                      </div>

                      {/* Vote Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant={user.myVote === 'upvote' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleVote(user.id, 'upvote')}
                          className={
                            user.myVote === 'upvote' ? 'bg-green-600 hover:bg-green-700' : ''
                          }
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={user.myVote === 'downvote' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleVote(user.id, 'downvote')}
                          className={
                            user.myVote === 'downvote' ? 'bg-red-600 hover:bg-red-700' : ''
                          }
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
