'use client';
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useSession } from 'next-auth/react';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';

type MsgKind = 'text' | 'voice' | 'file' | 'typing';
type MsgID = string | number;

interface Message {
  id: MsgID;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  type: MsgKind;
  text?: string;
  voiceUrl?: string;
  fileUrl?: string;
  filename?: string;
}

interface RawMessage {
  id: MsgID;
  sender_name: string;
  created_at?: string;
  type: MsgKind;
  content?: string;
  media_url?: string;
  filename?: string;
}

interface ChatWindowProps {
  backendBase?: string;
  wsUrl?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  backendBase,
  wsUrl,
}) => {
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const socket = useRef<WebSocket | null>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const BACKEND_BASE =
    backendBase ?? process.env.NEXT_PUBLIC_BACKEND_URL!;

  const WS_URL =
    wsUrl ??
    (process.env.NEXT_PUBLIC_WS_URL ??
      (process.env.NODE_ENV === 'production'
        ? 'wss://team-chatbot-backend-django.fly.dev/ws/input-data'
        : 'ws://localhost:8000/ws/input-data'));

  const absolutize = (maybe: string | undefined) =>
    maybe && maybe.startsWith('/') ? `${BACKEND_BASE}${maybe}` : maybe ?? '';

  const mapRaw = useCallback(
    (msg: RawMessage): Message => {
      if (msg.type === 'typing') {
        return {
          id: msg.id,
          sender: msg.sender_name,
          timestamp: '',
          isOwn: false,
          type: 'typing',
        };
      }

      const timeString = new Date(msg.created_at!).toLocaleTimeString([], {
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
    },
    [session, BACKEND_BASE],
  );

  const loadMoreMessages = useCallback(async () => {
    if (!session || !hasMore) return;

    try {
      const res = await fetch(
        `${BACKEND_BASE}/messages/?limit=${LIMIT}&offset=${offset}`,
      );
      if (!res.ok) {
        console.error('Page fetch failed:', res.statusText);
        return;
      }
      const data = await res.json();

      const converted = (data.results as RawMessage[])
        .reverse()
        .map(mapRaw);

      setMessages(prev => [...converted, ...prev]);
      if (data.results.length < LIMIT) setHasMore(false);
      setOffset(prev => prev + LIMIT);
    } catch (e) {
      console.error('Pagination error:', e);
    }
  }, [session, hasMore, offset, BACKEND_BASE, mapRaw]);

  useEffect(() => {
    loadMoreMessages();
  }, [loadMoreMessages]);

  useEffect(() => {
    const box = scrollBoxRef.current;
    if (!box) return;
    const onScroll = () => {
      if (box.scrollTop === 0) loadMoreMessages();
    };
    box.addEventListener('scroll', onScroll);
    return () => box.removeEventListener('scroll', onScroll);
  }, [loadMoreMessages]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const ws = new WebSocket(WS_URL);
    socket.current = ws;

    ws.onmessage = evt => {
      try {
        const raw: RawMessage = JSON.parse(evt.data);

        setMessages(prev => {
          const cleaned = prev.filter(
            m =>
              !(m.type === 'typing' && m.sender === raw.sender_name),
          );

          if (raw.type === 'typing') {
            return [...cleaned, mapRaw(raw)];
          }

          return [...cleaned, mapRaw(raw)];
        });
      } catch (err) {
        console.error('Bad WS payload:', err);
      }
    };

    ws.onopen = () => console.log('WS open');
    ws.onerror = err => console.error('WS error', err);
    ws.onclose = () => console.log('WS closed');
    return () => ws.close();
  }, [status, WS_URL, mapRaw]);

  const handleSendVoice = useCallback(
    async (blob: Blob) => {
      if (!session?.user?.name) return;
      const fd = new FormData();
      fd.append('sender_name', session.user.name);
      fd.append('voice_file', blob, `voice_${Date.now()}.webm`);

      const res = await fetch(`${BACKEND_BASE}/voice_notes/`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        console.error(await res.text());
        return;
      }
      const saved = await res.json();
      socket.current?.readyState === WebSocket.OPEN &&
        socket.current.send(JSON.stringify(saved));
    },
    [session, BACKEND_BASE],
  );

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
        console.error(await res.text());
        return;
      }
      const saved = await res.json();
      socket.current?.readyState === WebSocket.OPEN &&
        socket.current.send(JSON.stringify(saved));
    },
    [session, BACKEND_BASE],
  );

  const handleSendText = useCallback(
    async (text: string) => {
      if (!session?.user?.name) return;

      const payload = {
        sender_name: session.user.name,
        content: text,
        type: 'text',
      };

      const res = await fetch(`${BACKEND_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(await res.text());
        return;
      }

      const saved = await res.json();
      socket.current?.readyState === WebSocket.OPEN &&
        socket.current.send(JSON.stringify(saved));
    },
    [session, BACKEND_BASE],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (status === 'loading') return <div className="p-4">Loading…</div>;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      <div
        ref={scrollBoxRef}
        className="flex-1 overflow-y-auto p-6 space-y-2"
      >
        <div className="text-center py-4">
          <span className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
            Welcome to Knowledge Hub
          </span>
        </div>

        {messages.map(m => (
          <MessageBubble key={`${m.id}-${m.timestamp}`} message={m} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0">
        <ChatInput
          onSendMessage={handleSendText}
          onSendVoice={handleSendVoice}
          onSendFile={handleSendFile}
        />
      </div>
    </div>
  );
};
