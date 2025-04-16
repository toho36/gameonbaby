"use client";

import { useForm } from "react-hook-form";
import { Event } from "~/features/events/types";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";
import { RegistrationFormValues } from "~/features/registration/types";
import { RegistrationFormSchema } from "~/features/registration/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateQRCodeURL } from "~/utils/qrCodeUtils";
import PaymentMethodSelector from "./PaymentMethodSelector";

interface AuthenticatedUserViewProps {
  event: Event;
  eventId: string;
  eventDate: string;
  paymentPreference: string;
  setPaymentPreference: (value: string) => void;
  updatePaymentPreference: (value: string) => void;
  onRegistrationSuccess: (registration: any, qrCode?: string | null) => void;
  onWaitingListSuccess: () => void;
  user: any;
}

export default function AuthenticatedUserView({
  event,
  eventId,
  eventDate,
  paymentPreference,
  setPaymentPreference,
  updatePaymentPreference,
  onRegistrationSuccess,
  onWaitingListSuccess,
  user,
}: AuthenticatedUserViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { incrementRegistrationCount } = useEventRegistrationStore();

  const handleQuickRegister = async () => {
    if (event._count.Registration >= event.capacity) {
      toast.error("Event is full");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          paymentPreference,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update the registration count in the store
        incrementRegistrationCount();

        // Generate QR code regardless of payment type
        const name = user?.given_name || user?.family_name || "User";
        const qrUrl = generateQRCodeURL(name, eventDate, event.price);

        onRegistrationSuccess(data.registration, qrUrl);

        toast.success(
          "Registration successful! Check your email for confirmation.",
        );
      } else {
        if (data.message && data.message.includes("already registered")) {
          toast.error("You are already registered for this event");
        } else {
          toast.error(data.error || data.message || "Registration failed");
        }
      }
    } catch (error) {
      toast.error("Registration failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleJoinWaitingList = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch("/api/waitinglist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          paymentPreference,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onWaitingListSuccess();
        toast.success("You've been added to the waiting list!");
      } else {
        toast.error(
          data.error || data.message || "Failed to join waiting list",
        );
      }
    } catch (error) {
      toast.error("Failed to join waiting list");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/20 bg-gradient-to-br from-purple-900/70 to-indigo-900/70 p-6 text-white shadow-lg backdrop-blur-sm">
      <div className="space-y-5">
        <div className="mb-4">
          <h3 className="mb-2 text-center text-xl font-bold">
            {event._count.Registration >= event.capacity
              ? "Join the Waiting List"
              : "Register for This Event"}
          </h3>
          <p className="text-center text-white/80">
            {event._count.Registration >= event.capacity
              ? "Get notified when a spot becomes available"
              : `Secure your spot for ${eventDate}`}
          </p>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            Payment Method <span className="text-red-300">*</span>
          </label>
          <PaymentMethodSelector
            value={paymentPreference}
            onChange={(value) => {
              setPaymentPreference(value);
              updatePaymentPreference(value);
            }}
          />
        </div>

        <button
          onClick={
            event._count.Registration >= event.capacity
              ? handleJoinWaitingList
              : handleQuickRegister
          }
          disabled={isUpdating}
          className="w-full rounded-lg bg-white/20 p-3.5 font-medium text-white transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
        >
          {isUpdating ? (
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
              {event._count.Registration >= event.capacity
                ? "Joining..."
                : "Registering..."}
            </span>
          ) : event._count.Registration >= event.capacity ? (
            <span className="flex items-center justify-center">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Join Waiting List
            </span>
          ) : (
            <span className="flex items-center justify-center">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Register Now
            </span>
          )}
        </button>

        {event._count.Registration >= event.capacity && (
          <div className="rounded-lg border border-orange-300/30 bg-orange-400/10 p-4 text-sm">
            <div className="flex">
              <svg
                className="mr-3 h-5 w-5 flex-shrink-0 text-orange-300"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <div>
                <span className="font-medium text-orange-300">Event full!</span>{" "}
                You can join the waiting list to be notified if spots become
                available.
              </div>
            </div>
          </div>
        )}

        {event._count.Registration >= event.capacity - 5 &&
          event._count.Registration < event.capacity && (
            <div className="rounded-lg border border-indigo-300/30 bg-indigo-400/10 p-4 text-sm">
              <div className="flex">
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <div>
                  <span className="font-medium text-indigo-300">
                    Almost full!
                  </span>{" "}
                  Only {event.capacity - event._count.Registration} spots
                  remaining.
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
