"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "~/components/ui/button";

export default function DashboardPage() {
  const { user } = useKindeBrowserClient();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to your Dashboard
          </h1>
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Profile
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-lg text-gray-900">
                    {user?.given_name} {user?.family_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-lg text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Account Status
                  </p>
                  <p className="mt-1 text-lg text-gray-900">Active</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <LogoutLink>
                <Button variant="outline">Sign out</Button>
              </LogoutLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
