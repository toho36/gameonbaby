"use client";

import {
  LoginLink,
  RegisterLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export function Navbar() {
  const { user, isAuthenticated } = useKindeBrowserClient();

  return (
    <nav className="border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              GameOn Baby
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.given_name} {user?.family_name}
                  </span>
                  <LogoutLink>
                    <Button variant="outline">Sign out</Button>
                  </LogoutLink>
                </div>
              </div>
            ) : (
              <>
                <LoginLink postLoginRedirectURL="/dashboard">
                  <Button variant="outline">Sign in</Button>
                </LoginLink>
                <RegisterLink postLoginRedirectURL="/dashboard">
                  <Button>Sign up</Button>
                </RegisterLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
