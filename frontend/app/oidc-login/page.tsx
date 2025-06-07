"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OIDCLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  // Get accessToken directly from URL query parameter
  const accessToken = searchParams.get("accessToken");

  useEffect(() => {
    if (accessToken) {
      // Store the access token in localStorage
      localStorage.setItem("accessToken", accessToken);

      // Redirect to dashboard/home after successful login
      router.push("/dashboard");
    } else {
      // If no token is present in the URL, this page is being accessed directly
      setIsLoading(false);
    }
  }, [accessToken, router]);

  function initiateLogin() {
    // Simply redirect to your authentication microservice - no parameters needed
    window.location.href = "http://localhost/api/auth/google";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign In</h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-600">Processing authentication...</p>
          </div>
        ) : (
          <button
            onClick={initiateLogin}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Sign In with Single Sign-On
          </button>
        )}
      </div>
    </div>
  );
}
