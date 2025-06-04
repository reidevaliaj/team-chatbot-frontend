// components/ChatSidebar.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { TrendingUp, BarChart2, Users, FileText, Calendar, Star } from 'lucide-react';
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
    title: 'Chat',
    description: 'AI chat',
    path: '/chat',
  },
  {
    icon: BarChart2,
    title: 'Bank Analysis',
    description: 'Analyze your bank data',
    path: '/bank-analysis',
  },
  {
    icon: Users,
    title: 'Team Directory',
    description: 'Your wealth management team',
    path: '/team-directory',
  },
  {
    icon: FileText,
    title: 'Portfolio Reports',
    description: 'Quarterly performance updates',
    path: '/portfolio-reports',
  },
  {
    icon: Calendar,
    title: 'Upcoming Reviews',
    description: 'Scheduled consultations',
    path: '/upcoming-reviews',
  },
  {
    icon: Star,
    title: 'Investment Goals',
    description: 'Track your financial objectives',
    path: '/investment-goals',
  },
];

const activeAdvisors = [
  { name: 'Rei Aliaj', role: 'Developer', status: 'online' },
];

export const ChatSidebar: React.FC = () => {
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Knowledge Hub</h2>
        <p className="text-sm text-gray-600">Financial collaboration space 2</p>
        <div className="text-xs text-gray-500 truncate">
          <SignOutButton />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tools</h3>
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = router.pathname === item.path;
            return (
              <Link key={item.path} href={item.path} passHref>
                <button
                  className={`
                    w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left
                    ${isActive 
                      ? 'bg-blue-50 border-l-4 border-blue-600' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <item.icon
                    size={18}
                    className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}
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

      {/* Active Team Members */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Users</h3>
        <div className="space-y-3">
          {activeAdvisors.map((advisor, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-sm font-semibold">
                  {getInitials(advisor.name)}
                </div>
                <div
                  className={`
                    absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                    ${advisor.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}
                  `}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {advisor.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{advisor.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">Lorem Ipsum</p>
          <p className="text-xs text-gray-600">Lorem Ipsum Dolor sit amet</p>
        </div>
      </div>
    </div>
  );
};
