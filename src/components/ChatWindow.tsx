'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

/* ───────── Types ───────── */
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
interface RawMessage {
  id: number;
  sender_name: string;
  created_at: string;
  type: 'text' | 'voice' | 'file';
  content?: string;
  media_url?: string;
  filename?: string;
}

/* ───────── Component ───────── */
export const ChatWindow = () => {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useRef<WebSocket | null>(null);

  /* ✨ pagination state */
  const [offset, setOffset]   = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const scrollBoxRef   = useRef<HTMLDivElement>(null); /* ✨ */
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const WS_URL =
    process.env.NEXT_PUBLIC_WS_URL ??
    (process.env.NODE_ENV === 'production'
      ? 'wss://team-chatbot-backend-django.fly.dev/ws/chat'
      : 'ws://localhost:8000/ws/chat');

  const absolutize = (maybePath?: string) =>
    maybePath && maybePath.startsWith('/')
      ? `${BACKEND_BASE}${maybePath}`
      : maybePath ?? '';

  /* ───────── Raw -> UI message (unchanged) ───────── */
  const mapRaw = (msg: RawMessage): Message => {
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
        voiceUrl: absolutize(msg.media_url),
      };
    }
    if (msg.type === 'file' && msg.media_url) {
      return {
        id: msg.id,
        sender: msg.sender_name,
        timestamp: timeString,
        isOwn,
        type: 'file',
        fileUrl: absolutize(msg.media_url),
        filename: msg.filename,
      };
    }
    return {
      id: msg.id,
      sender: msg.sender_name,
      timestamp: timeString,
      isOwn,
      type: 'text',
      text: msg.content ?? '',
    };
  };

  /* ───────── Pagination fetch ───────── */
  const loadMoreMessages = useCallback(async () => {
    if (!session || !hasMore) return;
    try {
      const res = await fetch(
        `${BACKEND_BASE}/messages/?limit=${LIMIT}&offset=${offset}`,
      );
      if (!res.ok) {
        console.error('Failed to fetch messages page:', res.statusText);
        return;
      }
      const data = await res.json(); // DRF: {results: [...]}

      const converted = (data.results as RawMessage[]).reverse().map(mapRaw);
      setMessages(prev => [...converted, ...prev]); // prepend older msgs
      if (data.results.length < LIMIT) setHasMore(false);
      setOffset(prev => prev + LIMIT);
    } catch (err) {
      console.error('Pagination fetch error:', err);
    }
  }, [session, offset, hasMore, BACKEND_BASE, LIMIT, mapRaw]);

  /* load first page */
  useEffect(() => {
    loadMoreMessages();
  }, [loadMoreMessages]);

  /* ───────── Scroll-top triggers next page ───────── */
  useEffect(() => {
    const box = scrollBoxRef.current;
    if (!box) return;
    const onScroll = () => {
      if (box.scrollTop === 0) loadMoreMessages();
    };
    box.addEventListener('scroll', onScroll);
    return () => box.removeEventListener('scroll', onScroll);
  }, [loadMoreMessages]);

  /* ───────── WebSocket (unchanged) ───────── */
  useEffect(() => {
    if (status !== 'authenticated') return;
    const ws = new WebSocket(WS_URL);
    socket.current = ws;

    ws.onopen = () => console.log('WebSocket connected');

    ws.onmessage = (event) => {
      try {
        const raw: RawMessage = JSON.parse(event.data);
        setMessages(prev => [...prev, mapRaw(raw)]);
      } catch (err) {
        console.error('Invalid WebSocket payload:', err);
      }
    };

    ws.onerror = (err) => console.error('WebSocket error', err);
    ws.onclose = () => console.log('WebSocket disconnected');

    return () => ws.close();
  }, [status, WS_URL, mapRaw]);

  /* ───────── Voice note ───────── */
  const handleSendVoiceNote = useCallback(
    async (audioBlob: Blob) => {
      if (!session?.user?.name) return;

      const formData = new FormData();
      formData.append('sender_name', session.user.name);
      formData.append('voice_file', audioBlob, `voice_${Date.now()}.webm`);

      const res = await fetch(`${BACKEND_BASE}/voice_notes/`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.error('Failed to upload voice note:', await res.text());
        return;
      }

      const saved = await res.json();
      socket.current?.readyState === WebSocket.OPEN &&
        socket.current.send(JSON.stringify(saved));
    },
    [session?.user?.name, BACKEND_BASE],
  );

  /* ───────── File ───────── */
  const handleSendFile = useCallback(
    async (file: File) => {
      if (!session?.user?.name) return;

      const fd = new FormData();
      fd.append('sender_name', session.user.name);
      fd.append('file', file);

      const res = await fetch(`${BACKEND_BASE}/files/`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        console.error('Failed to upload file:', await res.text());
        return;
      }

      const saved = await res.json();
      socket.current?.readyState === WebSocket.OPEN &&
        socket.current.send(JSON.stringify(saved));
    },
    [session?.user?.name, BACKEND_BASE],
  );

  /* ───────── Text ───────── */
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!session?.user?.name) return;

      const payload = {
        sender_name: session.user.name,
        content: text,
        type: 'text',
      };

      try {
        const res = await fetch(`${BACKEND_BASE}/messages/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.error('Failed to send text message:', await res.text());
          return;
        }
        const saved = await res.json();
        socket.current?.readyState === WebSocket.OPEN &&
          socket.current.send(JSON.stringify(saved));
      } catch (err) {
        console.error('Error in handleSendMessage:', err);
      }
    },
    [session?.user?.name, BACKEND_BASE],
  );

  /* auto-scroll to bottom on new appended msgs */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (status === 'loading') return <div className="p-4">Loading...</div>;

  /* ───────── UI ───────── */
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      <div
        ref={scrollBoxRef}                                /* ← scrollable div */
        className="flex-1 overflow-y-auto p-6 space-y-2"
      >
        <div className="text-center py-4">
          <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            Welcome to Knowledge Hub
          </div>
        </div>

        {messages.map((msg) => (
          <MessageBubble key={msg.id + msg.timestamp} message={msg} />
        ))}

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
