"use client";

import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <KindeProvider
      authUrl={process.env.NEXT_PUBLIC_KINDE_AUTH_URL}
      clientId={process.env.NEXT_PUBLIC_KINDE_CLIENT_ID}
      logoutUri={process.env.NEXT_PUBLIC_KINDE_LOGOUT_URL}
      redirectUri={process.env.NEXT_PUBLIC_KINDE_REDIRECT_URL}
    >
      {children}
    </KindeProvider>
  );
}
