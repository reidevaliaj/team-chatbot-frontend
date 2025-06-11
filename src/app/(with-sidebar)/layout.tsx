// app/(with-sidebar)/layout.tsx
'use client';

import React, { useState, ReactNode } from 'react';
import { ChatSidebar } from '../../components/ChatSidebar';
import { Menu, X } from 'lucide-react';

export default function WithSidebarLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Hamburger toggle (mobile only) */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded-md shadow"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar drawer */}
      <div
        className={`
          fixed inset-y-0 right-0 w-64 bg-white border-l border-gray-300
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          md:relative md:translate-x-0 md:flex-shrink-0
        `}
      >
        {/* Close button (mobile only) */}
        <div className="md:hidden flex justify-end p-4">
          <button onClick={() => setIsOpen(false)} className="p-2">
            <X size={24} />
          </button>
        </div>
        <ChatSidebar />
      </div>

      {/* Backdrop when open (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-25 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className="flex-1 flex flex-col overflow-y-auto min-w-0"
        // clicking main area closes sidebar on mobile
        onClick={() => isOpen && setIsOpen(false)}
      >
        {children}
      </div>
    </div>
  );
}
