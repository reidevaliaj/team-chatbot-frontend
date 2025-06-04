// app/(with-sidebar)/layout.tsx
'use client';
import React, { ReactNode } from 'react';
import { ChatSidebar } from '../../components/ChatSidebar';

// This layout wraps ALL routes inside (with-sidebar)
export default function WithSidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main content area (left) */}
      <div className="flex-1 flex overflow-y-auto flex-col min-w-0">
        {children}
      </div>

      {/* Sidebar (right) */}
      <div className="w-80 border-l border-gray-300 bg-white">
        <ChatSidebar />
      </div>
    </div>
  );
}
