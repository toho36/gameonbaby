"use client";

import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Welcome to GameOn Baby
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account or create a new one
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex flex-col space-y-4">
            <LoginLink postLoginRedirectURL="/dashboard">
              <Button className="w-full">Sign in</Button>
            </LoginLink>
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <RegisterLink>
                <Button variant="link" className="p-0">
                  Sign up
                </Button>
              </RegisterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
