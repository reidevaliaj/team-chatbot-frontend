'use client';

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-4 py-2 rounded bg-gradient-to-br from-blue-600 to-green-600 text-white hover:bg-red-600 transition"
    >
      Sign Out
    </button>
  );
}
