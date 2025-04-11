"use client";
import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { createRegistration } from "~/actions/actions";
import { sendRegistrationEmail } from "~/server/service/emailService";

const eventLocation = "Sportovní hala TJ JM Chodov, Mírového hnutí 2137";

function generateQRCodeURL(name: string, eventDate: string) {
  const paymentString = `SPD*1.0*ACC:CZ9130300000001628400020*RN:VU LOAN TIKOVSKA*AM:150*CC:CZK*MSG:GameOn ${name} for event on ${eventDate}`;
  const encodedPaymentString = encodeURIComponent(paymentString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedPaymentString}`;
}

interface RegistrationFormProps {
  eventId: string;
  eventDate?: string;
  eventPlace?: string | null;
  eventPrice?: number;
}

export default function RegistrationForm({
  eventId,
  eventDate = "26.10. 18:15-21:15",
  eventPlace = "Sportovní hala TJ JM Chodov, Mírového hnutí 2137",
  eventPrice = 150,
}: RegistrationFormProps) {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState<string>("CARD");
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phoneNumber: "",
  });
  const [userRegistration, setUserRegistration] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Check if user is already registered for this event
      checkUserRegistration();
      // Fetch user's payment preference
      fetchPaymentPreference();
    }
  }, [isAuthenticated, user?.id]);

  async function fetchPaymentPreference() {
    try {
      const response = await fetch("/api/user/payment-preference");
      const data = await response.json();
      if (data.success) {
        setPaymentPreference(data.paymentPreference);
      }
    } catch (error) {
      console.error("Error fetching payment preference:", error);
    }
  }

  async function updatePaymentPreference(preference: string) {
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
      }
    } catch (error) {
      console.error("Error updating payment preference:", error);
    }
  }

  async function checkUserRegistration() {
    try {
      const response = await fetch(
        `/api/events/${eventId}/registration-status`,
      );
      const data = await response.json();
      if (data.success && data.registration) {
        setUserRegistration(data.registration);
        setIsRegistered(true);
      }
    } catch (error) {
      console.error("Error checking registration status:", error);
    }
  }

  async function handleQuickRegister() {
    if (!user) return;

    const formDataObj = new FormData();
    formDataObj.append("event_id", eventId);
    formDataObj.append(
      "first_name",
      user.given_name || user.email?.split("@")[0] || "",
    );
    formDataObj.append("email", user.email || "");
    formDataObj.append("payment_type", paymentPreference);

    const qrCode = generateQRCodeURL(
      user.given_name || user.email?.split("@")[0] || "",
      eventDate,
    );
    const response = await createRegistration(formDataObj);

    if (response.success) {
      setSuccess("Registration completed successfully!");
      await sendRegistrationEmail(
        user.email || "",
        user.given_name || "",
        qrCode,
        eventDate,
      );
      setQrCodeUrl(qrCode);
      setIsRegistered(true);
      if (response.registration) {
        setUserRegistration(response.registration);
      } else {
        await checkUserRegistration();
      }
    } else {
      setError(response.message ?? "Registration failed. Please try again.");
    }
  }

  async function handleUnregister() {
    if (!userRegistration) return;

    try {
      const response = await fetch(`/api/events/${eventId}/unregister`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setIsRegistered(false);
        setUserRegistration(null);
        setSuccess("Successfully unregistered from the event.");
      } else {
        setError(data.message || "Failed to unregister from the event.");
      }
    } catch (error) {
      console.error("Error unregistering:", error);
      setError("Failed to unregister from the event.");
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formDataObj = new FormData(event.currentTarget);
    const firstName = formDataObj.get("first_name") as string;
    const email = formDataObj.get("email") as string;
    const phoneNumber = formDataObj.get("phone_number") as string;

    setFormData({ firstName, email, phoneNumber });

    formDataObj.append("event_id", eventId);

    const qrCode = generateQRCodeURL(firstName, eventDate);
    const response = await createRegistration(formDataObj);

    if (response.success) {
      setSuccess("Registration completed successfully!");
      await sendRegistrationEmail(email, firstName, qrCode, eventDate);
      setQrCodeUrl(qrCode);
      setIsRegistered(true);
      if (response.registration) {
        setUserRegistration(response.registration);
      } else {
        await checkUserRegistration(); // Fallback to fetching registration data
      }
    } else {
      setError(response.message ?? "Registration failed. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  return (
    <div className="w-full">
      {!isRegistered ? (
        <>
          <h2 className="mb-6 text-center text-2xl font-bold text-white">
            Game On - Registration
          </h2>

          {isAuthenticated && !showFullForm ? (
            <div className="space-y-4">
              <div className="rounded-md border border-purple-400/30 bg-[#1e114a] p-4">
                <p className="mb-2 text-white">Logged in as: {user?.email}</p>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-white">
                    Payment Method
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex flex-1 cursor-pointer items-center rounded-md border border-purple-400 bg-[#1e114a] px-4 py-3 hover:border-purple-300 hover:bg-[#2a1a63]">
                      <input
                        type="radio"
                        name="payment_type"
                        value="CARD"
                        checked={paymentPreference === "CARD"}
                        onChange={() => updatePaymentPreference("CARD")}
                        className="mr-2 h-4 w-4 accent-purple-500"
                      />
                      <span className="text-sm text-white">QR Code</span>
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center rounded-md border border-purple-400 bg-[#1e114a] px-4 py-3 hover:border-purple-300 hover:bg-[#2a1a63]">
                      <input
                        type="radio"
                        name="payment_type"
                        value="CASH"
                        checked={paymentPreference === "CASH"}
                        onChange={() => updatePaymentPreference("CASH")}
                        className="mr-2 h-4 w-4 accent-purple-500"
                      />
                      <span className="text-sm text-white">Cash on Site</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={handleQuickRegister}
                  className="w-full rounded-md bg-purple-600 p-3 font-medium text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Quick Register
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm text-white/70">
                  Want to register with different details?{" "}
                  <button
                    onClick={() => setShowFullForm(true)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Use form instead
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  placeholder="Your name"
                  className="w-full rounded-md border border-purple-400 bg-[#1e114a] p-3 text-white placeholder:text-white/70 focus:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  className="w-full rounded-md border border-purple-400 bg-[#1e114a] p-3 text-white placeholder:text-white/70 focus:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="Your phone"
                  className="w-full rounded-md border border-purple-400 bg-[#1e114a] p-3 text-white placeholder:text-white/70 focus:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Payment Method
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex flex-1 cursor-pointer items-center rounded-md border border-purple-400 bg-[#1e114a] px-4 py-3 hover:border-purple-300 hover:bg-[#2a1a63]">
                    <input
                      type="radio"
                      name="payment_type"
                      value="CARD"
                      required
                      className="mr-2 h-4 w-4 accent-purple-500"
                    />
                    <span className="text-sm text-white">QR Code</span>
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center rounded-md border border-purple-400 bg-[#1e114a] px-4 py-3 hover:border-purple-300 hover:bg-[#2a1a63]">
                    <input
                      type="radio"
                      name="payment_type"
                      value="CASH"
                      required
                      className="mr-2 h-4 w-4 accent-purple-500"
                    />
                    <span className="text-sm text-white">Cash on Site</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-purple-600 p-3 font-medium text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Register
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-red-400/40 bg-red-900/40 p-3 text-center text-red-200">
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-md border border-green-400/30 bg-[#11372a] p-5 text-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <h2 className="mb-3 mt-2 text-xl font-bold text-white">
            {isAuthenticated
              ? "You're registered!"
              : "Registration Successful!"}
          </h2>

          <div className="mb-4 rounded bg-[#0d2d22] p-3 text-left">
            {isAuthenticated ? (
              <>
                <p className="mb-1">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                {userRegistration?.phoneNumber && (
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {userRegistration.phoneNumber}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mb-1">
                  <span className="font-medium">Name:</span>{" "}
                  {formData.firstName}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Email:</span> {formData.email}
                </p>
                {formData.phoneNumber && (
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {formData.phoneNumber}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mb-4 text-white/90">
            <p>
              Thank you for registering for GameOn event on{" "}
              <span className="font-medium text-white">{eventDate}</span>{" "}
              {eventPlace && (
                <>
                  at location{" "}
                  <span className="font-medium text-white">{eventPlace}</span>
                </>
              )}
            </p>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleUnregister}
              className="mt-4 rounded-md border border-red-400/30 bg-red-900/30 px-4 py-2 text-red-200 hover:bg-red-900/50"
            >
              Unregister from Event
            </button>
          )}
        </div>
      )}
    </div>
  );
}
