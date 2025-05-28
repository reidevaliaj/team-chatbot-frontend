'use client';
import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl mb-6">Sign in to the Team Chatbot</h1>
      <button
        onClick={() => signIn("azure-ad", { callbackUrl: "/chat" })}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Sign in with Microsoft
      </button>
    </div>
  );
}