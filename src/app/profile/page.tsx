"use client";

import { useState, useEffect, useRef } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "~/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileFormSchema, ProfileFormValues } from "./validations";
import toast from "react-hot-toast";
import { AuthCheck } from "~/components/AuthCheck";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  paymentPreference: string;
  image: string | null;
  phoneNumber: string | null;
}

export default function ProfilePage() {
  return (
    <AuthCheck>
      <ProfileContent />
    </AuthCheck>
  );
}

function ProfileContent() {
  const { user } = useKindeBrowserClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentPreference, setPaymentPreference] = useState<string>("CARD");
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit mode states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempName, setTempName] = useState<string>("");
  const [tempPhone, setTempPhone] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      image: null,
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/user/profile");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setProfile(data.user);
          setPaymentPreference(data.user.paymentPreference || "CARD");
          const name =
            data.user.name ||
            `${user?.given_name || ""} ${user?.family_name || ""}`.trim();
          setTempName(name);
          setTempPhone(data.user.phoneNumber || "");
          setProfileImage(data.user.image);

          // Set form default values
          setValue("name", name);
          setValue("phoneNumber", data.user.phoneNumber || "");
          setValue("image", data.user.image);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user?.given_name, user?.family_name, setValue]);

  if (loading) {
    return <div className="p-8 text-center">Loading your profile...</div>;
  }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        updateUserProfile({ image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const updateUserProfile = async (data: {
    name?: string;
    phoneNumber?: string;
    image?: string;
  }) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success) {
        setProfile(responseData.user);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNameSave = () => {
    if (tempName.trim() !== "") {
      updateUserProfile({ name: tempName });
      setIsEditingName(false);
    }
  };

  const handlePhoneSave = () => {
    try {
      // Validate the phone number using the Zod schema
      const result = ProfileFormSchema.shape.phoneNumber.safeParse(tempPhone);

      if (!result.success) {
        toast.error("Please enter a valid phone number");
        return;
      }

      updateUserProfile({ phoneNumber: tempPhone });
      setIsEditingPhone(false);
    } catch (error) {
      console.error("Phone validation error:", error);
      toast.error("Invalid phone number format");
    }
  };

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

          {/* Profile Picture */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div
                  className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100"
                  onClick={triggerImageUpload}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl font-bold text-gray-400">
                      {tempName ? tempName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <button
                  className="absolute bottom-0 right-0 rounded-full bg-purple-600 p-2 text-white shadow-lg hover:bg-purple-700"
                  onClick={triggerImageUpload}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full name</h3>
                {isEditingName ? (
                  <div className="mt-1 flex items-center">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="block w-full rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                      placeholder="Your name"
                      autoFocus
                    />
                    <button
                      onClick={handleNameSave}
                      className="ml-2 inline-flex items-center rounded bg-purple-600 p-1 text-white hover:bg-purple-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="ml-1 inline-flex items-center rounded bg-gray-200 p-1 text-gray-700 hover:bg-gray-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-md mt-1 flex items-center text-gray-900">
                    {profile?.name ||
                      `${user?.given_name} ${user?.family_name}`}
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Email address
                </h3>
                <p className="text-md mt-1 text-gray-900">
                  {profile?.email || user?.email}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Phone number
                </h3>
                {isEditingPhone ? (
                  <div className="mt-1 flex items-center">
                    <div className="w-full">
                      <input
                        type="tel"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        className={`block w-full rounded-md border ${
                          errors.phoneNumber
                            ? "border-red-500"
                            : "border-gray-300"
                        } py-1.5 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm`}
                        placeholder="Your phone number"
                        autoFocus
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.phoneNumber.message}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handlePhoneSave}
                      className="ml-2 inline-flex items-center rounded bg-purple-600 p-1 text-white hover:bg-purple-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsEditingPhone(false)}
                      className="ml-1 inline-flex items-center rounded bg-gray-200 p-1 text-gray-700 hover:bg-gray-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-md mt-1 flex items-center text-gray-900">
                    {profile?.phoneNumber || "Not set"}
                    <button
                      onClick={() => setIsEditingPhone(true)}
                      className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </p>
                )}
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
            <div className="mt-4 space-y-4">
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
