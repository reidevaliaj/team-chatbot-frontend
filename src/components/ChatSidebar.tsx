// components/ChatSidebar.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, MessageSquare, BarChart2 } from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';

interface SidebarItem {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  {
    icon: TrendingUp,
    title: 'Input-Data',
    description: 'Input Data to Vector Database',
    path: '/input-data',
  },
  {
    icon: MessageSquare,
    title: 'Chat Now',
    description: 'Real-time chat',
    path: '/chat-now',
  },
  {
    icon: BarChart2,
    title: 'Bank Analysis',
    description: 'Analyze your bank data',
    path: '/bank-analysis',
  },
];

export const ChatSidebar: React.FC = () => {
  const pathname = usePathname();

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 2);

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Knowledge Hub</h2>
        <p className="text-sm text-gray-600">Future Wealth Group</p>
        <div className="text-xs text-gray-500 truncate">
          <SignOutButton />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tools</h3>
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <item.icon
                    size={18}
                    className={isActive ? 'text-blue-600' : 'text-gray-500'}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        isActive ? 'text-blue-500' : 'text-gray-500'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ───────────────── Guidelines card ───────────────── */}
      <div className="p-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          How to add knowledge
        </h3>
        <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
          <li>
            Share text (10 + words), PDFs, docs, links, or short videos with real
            context.
          </li>
          <li>Skip random notes—every item is stored in the database.</li>
          <li>
            Keep uploads small; trim docs or videos to the parts you actually
            need.
          </li>
          <li>
            Wait for the <span className="font-medium">“Saved&nbsp;to&nbsp;database”</span>{' '}
            ✅ before sending the next message.
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">Knowledge Hub</p>
          <p className="text-xs text-gray-600">FWG</p>
        </div>
      </div>
    </div>
  );
};
