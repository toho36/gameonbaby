"use client";

import React, { useState } from "react";
import UnregisterButton from "./UnregisterButton";
import { Event } from "~/features/events/types";
import { toast } from "react-hot-toast";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";
import DuplicateRegistrationModal from "./DuplicateRegistrationModal";
import { PaymentType } from "~/app/constant/paymentType";

interface RegistrationSuccessProps {
  event: Event;
  eventId: string;
  qrCodeUrl: string | null;
  profileImage: string | null;
  resetFormState: () => void;
  user?: any;
  userRegistration?: any;
  paymentPreference?: string;
}

export default function RegistrationSuccess({
  event,
  eventId,
  qrCodeUrl,
  profileImage,
  resetFormState,
  user,
  userRegistration,
  paymentPreference = "CARD",
}: RegistrationSuccessProps) {
  const [showFriendForm, setShowFriendForm] = useState(false);
  const [friendRegistrationSuccess, setFriendRegistrationSuccess] =
    useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isNameError, setIsNameError] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [friendName, setFriendName] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [friendQrCodeUrl, setFriendQrCodeUrl] = useState<string | null>(null);

  const { incrementRegistrationCount } = useEventRegistrationStore();

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `gameon-payment-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFriendRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset any existing error state before starting a new registration
    setIsNameError(false);
    setDuplicateName("");

    // Get the form values using the form element directly from the event
    const form = e.target as HTMLFormElement;
    const friendFirstName = form.friendFirstName.value.trim();
    const friendLastName = form.friendLastName.value.trim();

    if (!friendFirstName) {
      toast.error("Friend's first name is required");
      return;
    }

    setIsRegistering(true);
    try {
      // Make sure all required fields are present and correctly formatted
      const payload = {
        firstName: friendFirstName,
        lastName: friendLastName || "", // Ensure lastName is at least an empty string
        email: user?.email || "",
        phoneNumber: userRegistration?.phoneNumber || null,
        eventId: event.id,
        paymentType:
          paymentPreference === "CARD" ? PaymentType.CARD : PaymentType.CASH,
      };

      const response = await fetch("/api/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        toast.error("Invalid response from server");
        return;
      }

      if (response.ok) {
        // Only increment registration count on successful registration
        incrementRegistrationCount();
        setFriendRegistrationSuccess(true);

        // Set the complete friend name
        const fullFriendName = `${friendFirstName} ${friendLastName}`.trim();
        setFriendName(fullFriendName);

        // Generate QR code with friend's name
        import("~/utils/qrCodeUtils").then(({ generateQRCodeURL }) => {
          const friendQrUrl = generateQRCodeURL(
            fullFriendName,
            event.from,
            event.price,
          );
          setFriendQrCodeUrl(friendQrUrl);
        });

        toast.success("Friend successfully registered!");

        // Clear form inputs manually instead of using reset()
        try {
          // Only attempt to reset if the form is still in the DOM
          if (form && typeof form.reset === "function") {
            form.reset();
          }
        } catch (resetError) {
          // Ignore reset errors
        }
      } else {
        // Check for specific name-based duplicate error
        if (
          data.message &&
          data.message.includes("already exists a registration for") &&
          data.message.includes("with email")
        ) {
          // Extract the duplicate name from the error message
          // Format: "There already exists a registration for [NAME] with email..."
          const nameMatch = data.message.match(
            /registration for ([^]+?) with email/,
          );
          if (nameMatch && nameMatch[1]) {
            const name = nameMatch[1].trim();
            setDuplicateName(name);
            setIsNameError(true);
          } else {
            setIsNameError(false);
          }

          setShowDuplicateModal(true);
        } else if (
          data.message &&
          data.message.includes("already registered")
        ) {
          setIsNameError(false);
          setShowDuplicateModal(true);
        } else {
          toast.error(data.message || "Failed to register friend");
        }
      }
    } catch (error) {
      toast.error("Failed to register friend");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/20 bg-gradient-to-br from-purple-900/70 to-indigo-900/70 p-6 text-white shadow-lg backdrop-blur-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="rounded-full bg-green-500/20 p-4">
            {profileImage ? (
              <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white/30">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white">
            Registration Successful!
          </h3>
          <p className="text-lg text-white/90">
            A confirmation email has been sent to your email address.
          </p>
        </div>

        {qrCodeUrl && (
          <div className="mb-6 w-full overflow-hidden rounded-xl border border-white/20 bg-white/10 p-6 transition-all hover:bg-white/15">
            <div className="flex flex-col items-center">
              <h4 className="mb-4 text-lg font-bold text-white">
                Payment Code
              </h4>
              <div className="mb-4 flex justify-center rounded-lg bg-white p-3 shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  className="h-auto w-full max-w-[200px] rounded-md"
                />
              </div>
              <div className="mb-4 text-2xl font-bold text-green-300">
                {event.price} Kč
              </div>
              <button
                onClick={downloadQRCode}
                className="flex w-full items-center justify-center rounded-lg bg-white/20 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-purple-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Save QR Code
              </button>
            </div>
          </div>
        )}

        {/* Friend Registration Section */}
        <div className="mb-6 mt-4 w-full">
          {!showFriendForm && !friendRegistrationSuccess && (
            <button
              onClick={() => {
                setShowFriendForm(true);
                setIsNameError(false);
                setDuplicateName("");
              }}
              className="w-full rounded-lg bg-indigo-600/80 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            >
              <div className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Register a Friend
              </div>
            </button>
          )}

          {showFriendForm && !friendRegistrationSuccess && (
            <div className="w-full rounded-xl border border-white/20 bg-white/10 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">
                  Register a Friend
                </h4>
                <button
                  onClick={() => {
                    setShowFriendForm(false);
                    setIsNameError(false);
                    setDuplicateName("");
                  }}
                  className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="mb-4 text-sm text-white/80">
                Register a friend using your contact details. They'll be
                registered with your email and phone number.
              </p>

              {isNameError && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-5 w-5 flex-shrink-0 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">Name already registered</p>
                      <p className="mt-1">
                        {duplicateName} is already registered for this event.
                        Please use a different name.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleFriendRegistration} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Friend's First Name <span className="text-red-300">*</span>
                  </label>
                  <input
                    type="text"
                    name="friendFirstName"
                    required
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder-white/50 focus:border-white/40 focus:ring focus:ring-white/20"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Friend's Last Name
                  </label>
                  <input
                    type="text"
                    name="friendLastName"
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder-white/50 focus:border-white/40 focus:ring focus:ring-white/20"
                    placeholder="Last name"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-center font-medium text-white transition-all hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    {isRegistering ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="mr-2 h-5 w-5 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Registering...
                      </span>
                    ) : (
                      "Register Friend"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {friendRegistrationSuccess && (
            <div className="w-full rounded-xl border border-green-500/20 bg-green-500/10 p-5">
              <div className="mb-3 flex items-center">
                <div className="mr-3 rounded-full bg-green-500/20 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h4 className="font-bold text-green-300">Friend Registered!</h4>
              </div>

              <p className="mb-3 text-sm text-white/90">
                {friendName} has been successfully registered for this event.
                They'll be using your contact details.
              </p>

              {friendQrCodeUrl && (
                <div className="mb-4 w-full overflow-hidden rounded-xl border border-white/20 bg-white/10 p-4 transition-all hover:bg-white/15">
                  <div className="flex flex-col items-center">
                    <h4 className="mb-3 text-sm font-bold text-white">
                      {friendName}'s Payment Code
                    </h4>
                    <div className="mb-3 flex justify-center rounded-lg bg-white p-2 shadow-lg">
                      <img
                        src={friendQrCodeUrl}
                        alt="Friend's Payment QR Code"
                        className="h-auto w-full max-w-[150px] rounded-md"
                      />
                    </div>
                    <div className="mb-3 text-xl font-bold text-green-300">
                      {event.price} Kč
                    </div>
                    <button
                      onClick={() => {
                        if (!friendQrCodeUrl) return;
                        const link = document.createElement("a");
                        link.href = friendQrCodeUrl;
                        link.download = `gameon-payment-friend-${new Date().getTime()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex w-full items-center justify-center rounded-lg bg-white/20 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-purple-900"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Save QR Code
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowFriendForm(true);
                  setFriendRegistrationSuccess(false);
                  setIsNameError(false);
                  setDuplicateName("");
                  setFriendQrCodeUrl(null);
                }}
                className="w-full rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
              >
                Register Another Friend
              </button>
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="flex items-center justify-center">
            <UnregisterButton eventId={eventId} refreshForm={resetFormState} />
          </div>
        </div>
      </div>

      {/* Add the DuplicateRegistrationModal */}
      <DuplicateRegistrationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        email={user?.email || ""}
        nameError={isNameError}
        duplicateName={duplicateName}
      />
    </div>
  );
}
