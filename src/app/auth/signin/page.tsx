// app/auth/signin/page.tsx
'use client';

import React from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Welcome to Knowledge Hub
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Collaborate, chat, and share files securely with your team. Please sign in with your Microsoft account to continue.
        </p>
        <button
          onClick={() => signIn('azure-ad', { callbackUrl: '/input-data' })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md transition flex items-center justify-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Microsoft logo path */}
            <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z" />
          </svg>
          <span>Sign in with Microsoft</span>
        </button>
      </div>
    </div>
  );
}