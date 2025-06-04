// app/(with-sidebar)/chat/page.tsx
import React from 'react';
import { ChatWindow } from '../../../components/ChatWindow';

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col">
      <ChatWindow />
    </div>
  );
}