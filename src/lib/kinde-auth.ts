// Helper functions for Kinde authentication

// Detect environment (client-side)
export function isLocalEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

// Get the appropriate base URL
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side
    return isLocalEnvironment()
      ? "http://localhost:3000"
      : "https://gameonbaby.vercel.app";
  }
  // Server-side
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.KINDE_SITE_URL || "http://localhost:3000";
}

// Get auth configuration
export function getAuthConfig() {
  const baseUrl = getBaseUrl();

  return {
    authUrl:
      process.env.NEXT_PUBLIC_KINDE_AUTH_URL || "https://gameon.kinde.com",
    clientId:
      process.env.NEXT_PUBLIC_KINDE_CLIENT_ID ||
      "4306c48e06a94300b5944061a4fc2189",
    logoutUrl: process.env.NEXT_PUBLIC_KINDE_LOGOUT_URL || baseUrl,
    redirectUrl:
      process.env.NEXT_PUBLIC_KINDE_REDIRECT_URL || `${baseUrl}/dashboard`,
    baseUrl,
  };
}
