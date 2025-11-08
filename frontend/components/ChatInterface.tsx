'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getChatMessages, sendChatMessage } from '@/lib/supabase/queries';
import type { ChatMessage } from '@/lib/types/database';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

interface ChatInterfaceProps {
  roomId: string;
  userId: string;
  taskId?: string;
}

export function ChatInterface({ roomId, userId, taskId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    try {
      const data = await getChatMessages(roomId);
      setMessages(data as ChatMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      // Send user message
      await sendChatMessage({
        room_id: roomId,
        sender_id: userId,
        message: messageText,
      });

      // Check if message is a question for AI
      if (messageText.includes('?') || messageText.toLowerCase().startsWith('help')) {
        // Simulate AI response (in production, integrate with OpenAI or similar)
        setTimeout(async () => {
          const aiResponse = await generateAIResponse(messageText);
          await sendChatMessage({
            room_id: roomId,
            sender_id: userId,
            message: aiResponse,
            is_ai_message: true,
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateAIResponse(userMessage: string): Promise<string> {
    // This is a simplified version - integrate with actual AI service
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return `I'm here to assist you! I can help you with:
- Understanding the task requirements
- Providing hints and guidance
- Explaining concepts related to the task
- Connecting you with the teacher for specific questions

What would you like help with?`;
    }

    if (lowerMessage.includes('hint')) {
      return `Here's a hint: Break down the problem into smaller steps and tackle them one at a time. Think about the core concepts involved and how they relate to what you've learned before.`;
    }

    if (lowerMessage.includes('stuck')) {
      return `It's okay to feel stuck! Try these strategies:
1. Review the task description carefully
2. Look at similar examples you've completed
3. Take a short break and come back with fresh eyes
4. Ask the teacher a specific question about what's confusing you

Would you like me to notify the teacher?`;
    }

    return `I understand you're asking about "${userMessage}". While I can provide general guidance, for specific task-related questions, I recommend reaching out to your teacher directly through this chat. They'll be able to give you personalized feedback!`;
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Collaborative Chat</CardTitle>
          <Badge variant="outline">
            <Bot className="w-3 h-3 mr-1" />
            AI Assistant Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.is_ai_message
                    ? 'justify-start'
                    : msg.sender_id === userId
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                {!msg.is_ai_message && msg.sender_id !== userId && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                {msg.is_ai_message && (
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.is_ai_message
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                      : msg.sender_id === userId
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  {msg.is_ai_message && (
                    <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      AI Assistant
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {msg.sender_id === userId && !msg.is_ai_message && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message... (use '?' for AI help)"
              className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            AI assistant will automatically respond to questions. Teachers and students can collaborate here.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
