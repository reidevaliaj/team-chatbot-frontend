'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';


interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
}

interface RawMessage {
  id: number;
  content: string;
  sender_name: string;
  created_at: string;
}

export const ChatWindow = () => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);



  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch('https://team-chatbot-backend.fly.dev/messages');
      const data = await res.json();
      const formatted = data.map((msg: RawMessage) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender_name,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isOwn: msg.sender_name === session?.user?.name,
      }));
      setMessages(formatted);
    };

    fetchMessages();
  }, []);

  const handleSendMessage = async (text: string) => {
    const newMessage = {
      sender_name: session?.user?.name || 'Unknown', // Will replace with session user later
      content: text,
    };

    const res = await fetch('https://team-chatbot-backend.fly.dev/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMessage),
    });

    const saved = await res.json();

    setMessages(prev => [
      ...prev,
      {
        id: saved.id,
        text: saved.content,
        sender: saved.sender_name,
        timestamp: new Date(saved.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isOwn: saved.sender_name === session?.user?.name,
      }
    ]);
  };
  if (status === "loading") {
    return <div className="p-4">Loading...</div>;
  }
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header and UI stays the same */}
      {/* ... */}

      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        <div className="text-center py-4">
          <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            Welcome to Knowledge Hub
          </div>
        </div>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};
