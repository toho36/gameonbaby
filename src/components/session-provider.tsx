"use client";

import { useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient();

  useEffect(() => {
    // Only run user sync when authenticated and not still loading
    if (isAuthenticated && !isLoading && user?.id) {
      // Call our user-sync endpoint without waiting for response
      fetch("/api/debug/user-sync")
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            console.error("Error syncing user session:", data);
          }
        })
        .catch((err) => {
          console.error("Failed to sync user session:", err);
        });
    }
  }, [isAuthenticated, isLoading, user?.id]);

  return <>{children}</>;
}
