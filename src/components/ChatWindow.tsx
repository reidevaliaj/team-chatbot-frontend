'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

//
// 1) Extend Message interface to include both text and voice
//
interface Message {
  id: number;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'voice';
  text?: string;      // only if type === 'text'
  voiceUrl?: string;  // only if type === 'voice'
}

//
// 2) RawMessage must match what GET /messages returns
//
interface RawMessage {
  id: number;
  sender_name: string;
  created_at: string;
  type: 'text' | 'voice';
  content?: string;       // when type === 'text'
  voice_url?: string;     // when type === 'voice'
}

export const ChatWindow = () => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useRef<WebSocket | null>(null);

  //
  // 3) Handle sending a voice note blob
  //
  const handleSendVoiceNote = async (audioBlob: Blob) => {
    if (!session?.user?.name) return;

    const formData = new FormData();
    formData.append('sender_name', session.user.name);
    formData.append('voice_file', audioBlob, `voice_${Date.now()}.webm`);

    // POST to /voice_notes
    const res = await fetch(
      'https://team-chatbot-backend.fly.dev/voice_notes',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!res.ok) {
      console.error('Failed to upload voice note:', await res.text());
      return;
    }

    // Expecting `{ id, sender_name, voice_url, timestamp, type: 'voice' }`
    const saved = await res.json();

    // Broadcast over WebSocket
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          type: 'voice',
          id: saved.id,
          sender_name: saved.sender_name,
          voice_url: saved.voice_url,
          created_at: saved.timestamp,
        })
      );
    }
  };

  //
  // 4) Load initial messages (both text & voice)
  //
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          'https://team-chatbot-backend.fly.dev/messages'
        );
        if (!res.ok) {
          console.error('Failed to fetch messages:', res.statusText);
          return;
        }
        const data: RawMessage[] = await res.json();

        const formatted: Message[] = data.map((msg) => {
          const timeString = new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const isOwn = msg.sender_name === session?.user?.name;

          if (msg.type === 'voice' && msg.voice_url) {
            return {
              id: msg.id,
              sender: msg.sender_name,
              timestamp: timeString,
              isOwn,
              type: 'voice',
              voiceUrl: msg.voice_url,
            };
          } else {
            // Fallback: assume msg.type === 'text'
            return {
              id: msg.id,
              sender: msg.sender_name,
              timestamp: timeString,
              isOwn,
              type: 'text',
              text: msg.content ?? '',
            };
          }
        });

        setMessages(formatted);
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    if (session) {
      fetchMessages();
    }
  }, [session]);

  //
  // 5) WebSocket connection & onmessage
  //
  useEffect(() => {
    if (status !== 'authenticated') return;

    const ws = new WebSocket(
      process.env.NODE_ENV === 'production'
        ? 'wss://team-chatbot-backend.fly.dev/ws/chat'
        : 'ws://localhost:8000/ws/chat'
    );
    socket.current = ws;

    ws.onopen = () => console.log('WebSocket connected');

    ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data) as {
          type: 'text' | 'voice';
          id: number;
          sender_name: string;
          content?: string;
          voice_url?: string;
          created_at: string;
        };

        const timeString = new Date(messageData.created_at).toLocaleTimeString(
          [],
          { hour: '2-digit', minute: '2-digit' }
        );
        const isOwn = messageData.sender_name === session?.user?.name;

        let newMessage: Message;

        if (messageData.type === 'voice' && messageData.voice_url) {
          newMessage = {
            id: messageData.id || Date.now(),
            sender: messageData.sender_name,
            timestamp: timeString,
            isOwn,
            type: 'voice',
            voiceUrl: messageData.voice_url,
          };
        } else {
          // Default to text case
          newMessage = {
            id: messageData.id || Date.now(),
            sender: messageData.sender_name,
            timestamp: timeString,
            isOwn,
            type: 'text',
            text: messageData.content ?? '',
          };
        }

        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        console.error('Invalid WebSocket payload:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [status, session?.user?.name]);

  //
  // 6) Handle sending a text message
  //
  const handleSendMessage = async (text: string) => {
    if (!session?.user?.name) return;

    const newMessagePayload = {
      sender_name: session.user.name,
      content: text,
    };

    try {
      const res = await fetch(
        'https://team-chatbot-backend.fly.dev/messages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMessagePayload),
        }
      );
      if (!res.ok) {
        console.error('Failed to send text message:', await res.text());
        return;
      }

      const saved = await res.json();
      // Assume backend returns e.g. { id, sender_name, content, created_at, type: 'text' }

      if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify(saved));
      }
    } catch (err) {
      console.error('Error in handleSendMessage:', err);
    }
  };

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        <div className="text-center py-4">
          <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            Welcome to Knowledge Hub
          </div>
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id + msg.timestamp} message={msg} />
        ))}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onSendVoice={handleSendVoiceNote}
      />
    </div>
  );
};
