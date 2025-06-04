// app/auth/signin/page.tsx
"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-6">Sign in to Knowledge Hub</h1>
        <button
          onClick={() => signIn("azure-ad", { callbackUrl: "/chat" })}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
