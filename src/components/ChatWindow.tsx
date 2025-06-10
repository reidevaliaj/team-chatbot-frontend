// ChatWindow.tsx
'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  type: 'text' | 'voice' | 'file';
  text?: string;
  voiceUrl?: string;
  fileUrl?: string;
  filename?: string;
}

//
// 2) RawMessage must match what GET /messages returns
//
interface RawMessage {
  id: number;
  sender_name: string;
  created_at: string;
  type: 'text' | 'voice' | 'file';
  content?: string;
  media_url?: string;
  filename?: string;
}

export const ChatWindow = () => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useRef<WebSocket | null>(null);

  // Base URL for backend (must be set in .env.local)
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

  // This ref will point to an empty <div> at the bottom of our scroll area.
  // Scrolling into view of this <div> pushes us to the bottom.
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  //
  // 3) Handle sending a voice note blob (useCallback for stability)
  //
  const handleSendVoiceNote = useCallback(
    async (audioBlob: Blob) => {
      if (!session?.user?.name) return;

      const formData = new FormData();
      formData.append('sender_name', session.user.name);
      formData.append('voice_file', audioBlob, `voice_${Date.now()}.webm`);

      // POST to /voice_notes
      const res = await fetch(`${BACKEND_BASE}/voice_notes`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.error('Failed to upload voice note:', await res.text());
        return;
      }

      // Expecting `{ id, sender_name, voice_url, created_at, type: 'voice' }`
      const saved = await res.json();

      // Broadcast over WebSocket
      if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(
          JSON.stringify({
            type: 'voice',
            id: saved.id,
            sender_name: saved.sender_name,
            voice_url: saved.media_url,
            created_at: saved.created_at,
          })
        );
      }
    },
    [session?.user?.name, BACKEND_BASE]
  );



  const handleSendFile = useCallback(
  async (file: File) => {
    if (!session?.user?.name) return;

    const formData = new FormData();
    formData.append('sender_name', session.user.name);
    formData.append('file', file);

    const res = await fetch(`${BACKEND_BASE}/files`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.error('Failed to upload file:', await res.text());
      return;
    }

    const saved = await res.json();

    // Broadcast via WebSocket
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          type: 'file',
          id: saved.id,
          sender_name: saved.sender_name,
          media_url: saved.media_url,
          filename: saved.filename,
          created_at: saved.created_at,
        })
      );
    }
  },
  [session?.user?.name, BACKEND_BASE]
);



  //
  // 4) Load initial messages (both text & voice)
  //
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/messages`);
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

          if (msg.type === 'voice' && msg.media_url) {
            return {
              id: msg.id,
              sender: msg.sender_name,
              timestamp: timeString,
              isOwn,
              type: 'voice',
              voiceUrl: `${BACKEND_BASE}${msg.media_url}`,  // ← use media_url
            };
          } else if (msg.type === 'file' && msg.media_url) {
            return {
              id: msg.id,
              sender: msg.sender_name,
              timestamp: timeString,
              isOwn,
              type: 'file',
              fileUrl: `${BACKEND_BASE}${msg.media_url}`,  // ← also media_url
              filename: msg.filename,
            };
          } else {
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
  }, [session, BACKEND_BASE]);

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
      type: 'text' | 'voice' | 'file';
      id: number;
      sender_name: string;
      content?: string;
      voice_url?: string;
      media_url?: string;
      filename?: string;
      created_at: string;
    };

    const timeString = new Date(messageData.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const isOwn = messageData.sender_name === session?.user?.name;

    let newMessage: Message;

    if (messageData.type === 'voice' && messageData.voice_url) {
      newMessage = {
        id: messageData.id,
        sender: messageData.sender_name,
        timestamp: timeString,
        isOwn,
        type: 'voice',
        voiceUrl: `${BACKEND_BASE}${messageData.voice_url}`,
      };
    } else if (messageData.type === 'file' && messageData.media_url) {
      newMessage = {
        id: messageData.id,
        sender: messageData.sender_name,
        timestamp: timeString,
        isOwn,
        type: 'file',
        fileUrl: `${BACKEND_BASE}${messageData.media_url}`,
        filename: messageData.filename,
      };
    } else {
      newMessage = {
        id: messageData.id,
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
  }, [status, session?.user?.name, BACKEND_BASE]);

  //
  // 6) Handle sending a text message (useCallback for stability)
  //
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!session?.user?.name) return;

      const newMessagePayload = {
        sender_name: session.user.name,
        content: text,
        type: 'text',
      };

      try {
        const res = await fetch(`${BACKEND_BASE}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMessagePayload),
        });
        if (!res.ok) {
          console.error('Failed to send text message:', await res.text());
          return;
        }

        const saved = await res.json();
        // Assume backend returns { id, sender_name, content, created_at, type: 'text' }

        if (socket.current?.readyState === WebSocket.OPEN) {
          socket.current.send(JSON.stringify(saved));
        }
      } catch (err) {
        console.error('Error in handleSendMessage:', err);
      }
    },
    [session?.user?.name, BACKEND_BASE]
  );

  //
  // 7) Whenever `messages` changes, scroll to bottom
  //
  useEffect(() => {
    if (messagesEndRef.current) {
      // Scroll into view of the dummy div at the bottom
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

        {/* Dummy div at end of list; scrolling into view pushes us to the bottom */}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            onSendVoice={handleSendVoiceNote}
            onSendFile={handleSendFile}
          />
      </div>
    </div>
  );
};
