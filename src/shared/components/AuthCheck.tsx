"use client";

import { useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "~/shared/components/ui/button";

interface AuthCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthCheck({ children, fallback }: AuthCheckProps) {
  const { isAuthenticated, isLoading } = useKindeBrowserClient();
  const [authChecked, setAuthChecked] = useState(false);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // If not authenticated or still loading, don't check yet
    if (!isAuthenticated || isLoading) {
      return;
    }

    // Only check session validity once we know we're supposed to be authenticated
    async function validateSession() {
      try {
        const response = await fetch("/api/auth/validate-session");
        const isValid = response.ok;
        setIsValid(isValid);
      } catch (error) {
        console.error("Session validation error:", error);
        setIsValid(false);
      } finally {
        setAuthChecked(true);
      }
    }

    validateSession();
  }, [isAuthenticated, isLoading]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated || (authChecked && !isValid)) {
    // If a custom fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Otherwise, show the default session expired UI
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75"></div>
        <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Session Expired
            </h2>
            <p className="mt-2 text-gray-600">
              Your login session has expired. Please sign in again to continue.
            </p>
          </div>
          <div className="flex justify-center">
            <LoginLink>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Sign In
              </Button>
            </LoginLink>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and valid session - show children
  return <>{children}</>;
}
