"use client";

import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "~/components/ui/button";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useKindeBrowserClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/user/profile");
        const data = await response.json();

        if (data.success) {
          setProfile(data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading your profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-lg font-medium leading-6 text-gray-900">
              User Profile
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your personal information and account settings
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full name</h3>
                <p className="text-md mt-1 text-gray-900">
                  {profile?.name || `${user?.given_name} ${user?.family_name}`}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Email address
                </h3>
                <p className="text-md mt-1 text-gray-900">
                  {profile?.email || user?.email}
                </p>
              </div>

              {profile && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Account Role
                    </h3>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                        profile.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : profile.role === "MODERATOR"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {profile.role}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Member since
                    </h3>
                    <p className="text-md mt-1 text-gray-900">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-sm font-medium text-gray-500">
              Account Settings
            </h3>

            <div className="mt-4 space-y-4">
              <a
                href="https://gameon.kinde.com/profile"
                target="_blank"
                rel="noreferrer"
                className="inline-block"
              >
                <Button variant="outline">Manage Account Settings</Button>
              </a>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-sm font-medium text-gray-500">
                  Sign out
                </h3>
                <LogoutLink>
                  <Button variant="outline">Sign Out of Your Account</Button>
                </LogoutLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
