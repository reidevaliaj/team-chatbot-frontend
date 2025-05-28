
import React from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';

export const ChatLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat Window - Left Side */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow />
      </div>
      
      {/* Sidebar - Right Side */}
      <div className="w-80 border-l border-gray-300 bg-white">
        <ChatSidebar />
      </div>
    </div>
  );
};
