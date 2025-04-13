"use client";

import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  // Detect if we're in local environment
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  // Use localhost URLs for local development, production URLs for production
  const baseUrl = isLocalhost
    ? "http://localhost:3000"
    : "https://gameonbaby.vercel.app";

  return (
    <QueryClientProvider client={queryClient}>
      <KindeProvider
        authUrl={process.env.NEXT_PUBLIC_KINDE_AUTH_URL}
        clientId={process.env.NEXT_PUBLIC_KINDE_CLIENT_ID}
      >
        {children}
      </KindeProvider>
    </QueryClientProvider>
  );
}
