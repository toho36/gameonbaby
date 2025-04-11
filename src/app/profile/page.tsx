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
  paymentPreference: string;
}

export default function ProfilePage() {
  const { user } = useKindeBrowserClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentPreference, setPaymentPreference] = useState<string>("CARD");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/user/profile");
        const data = await response.json();

        if (data.success) {
          setProfile(data.user);
          setPaymentPreference(data.user.paymentPreference || "CARD");
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

  const handlePaymentPreferenceChange = async (preference: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/user/payment-preference", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentPreference: preference }),
      });
      const data = await response.json();
      if (data.success) {
        setPaymentPreference(data.paymentPreference);
        if (profile) {
          setProfile({ ...profile, paymentPreference: data.paymentPreference });
        }
      }
    } catch (error) {
      console.error("Error updating payment preference:", error);
    } finally {
      setIsUpdating(false);
    }
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

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Payment Preferences
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-3">
                <label className="flex flex-1 cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-3 hover:border-gray-400">
                  <input
                    type="radio"
                    name="payment_preference"
                    value="CARD"
                    checked={paymentPreference === "CARD"}
                    onChange={() => handlePaymentPreferenceChange("CARD")}
                    disabled={isUpdating}
                    className="mr-2 h-4 w-4 accent-purple-500"
                  />
                  <span className="text-sm text-gray-700">QR Code Payment</span>
                </label>
                <label className="flex flex-1 cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-3 hover:border-gray-400">
                  <input
                    type="radio"
                    name="payment_preference"
                    value="CASH"
                    checked={paymentPreference === "CASH"}
                    onChange={() => handlePaymentPreferenceChange("CASH")}
                    disabled={isUpdating}
                    className="mr-2 h-4 w-4 accent-purple-500"
                  />
                  <span className="text-sm text-gray-700">Cash on Site</span>
                </label>
              </div>
              {isUpdating && (
                <p className="text-sm text-gray-500">Updating preference...</p>
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
