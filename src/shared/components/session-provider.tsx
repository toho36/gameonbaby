"use client";

import { useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { getAuthConfig } from "~/lib/kinde-auth";

interface SessionProviderProps {
  children: React.ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient();
  const [sessionValid, setSessionValid] = useState(true);
  const [logoutLink, setLogoutLink] = useState<HTMLAnchorElement | null>(null);

  // Initial user sync when authenticated
  useEffect(() => {
    // Only run user sync when authenticated and not still loading
    if (isAuthenticated && !isLoading && user?.id) {
      // Call our user-sync endpoint without waiting for response
      fetch("/api/debug/user-sync")
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
          }
        })
        .catch((err) => {});
    }
  }, [isAuthenticated, isLoading, user?.id]);

  // Create logout link programmatically
  useEffect(() => {
    if (!logoutLink) {
      const link = document.createElement("a");
      link.style.display = "none";
      link.id = "kinde-logout-link";
      const { authUrl, logoutUrl } = getAuthConfig();
      link.href = `${authUrl}/logout?redirect=${encodeURIComponent(logoutUrl)}`;
      document.body.appendChild(link);
      setLogoutLink(link);
    }

    return () => {
      const link = document.getElementById("kinde-logout-link");
      if (link) {
        document.body.removeChild(link);
      }
    };
  }, [logoutLink]);

  // Periodically validate the session
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    // Function to validate session by making a request to the API
    const validateSession = async () => {
      try {
        const res = await fetch("/api/auth/validate-session");

        if (!res.ok) {
          // If response is not ok, the token is invalid
          setSessionValid(false);
          // Force logout to refresh the tokens
          if (logoutLink) {
            logoutLink.click();
          }
        } else {
          setSessionValid(true);
        }
      } catch (error) {}
    };

    // Validate session immediately
    validateSession();

    // Then set up periodic check every 30 minutes instead of 5 minutes
    const intervalId = setInterval(validateSession, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, isLoading, logoutLink]);

  return <>{children}</>;
}
