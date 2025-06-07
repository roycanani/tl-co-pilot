"use client";

import { useAuth } from "../context/auth-context";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, login, user } = useAuth();

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-4xl font-bold">Welcome Team Leader</h1>

      {isAuthenticated ? (
        <div className="text-center">
          <p className="mb-4 text-xl">Hello, {user?.name || "User"}!</p>
          <Link
            href="/dashboard"
            className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-gray-700">Please sign in to continue</p>
          <button
            onClick={login}
            className="rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}
