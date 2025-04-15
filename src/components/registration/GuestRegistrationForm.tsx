import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import PaymentMethodSelector from "./PaymentMethodSelector";
import {
  RegistrationFormSchema,
  RegistrationFormValues,
} from "~/components/validations";
import { Event } from "~/types/Event";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";
import { generateQRCodeURL } from "~/utils/qrCodeUtils";

interface GuestRegistrationFormProps {
  event: Event;
  eventDate: string;
  onBack: () => void;
  onRegistrationSuccess: (registration: any, qrCode?: string | null) => void;
  onWaitingListSuccess: () => void;
}

export default function GuestRegistrationForm({
  event,
  eventDate,
  onBack,
  onRegistrationSuccess,
  onWaitingListSuccess,
}: GuestRegistrationFormProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState("");
  const router = useRouter();
  const { incrementRegistrationCount } = useEventRegistrationStore();

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      paymentType: "CARD",
      eventId: event.id,
    },
  });

  const handleGuestRegistration = async (data: RegistrationFormValues) => {
    setIsUpdating(true);

    if (event._count.Registration >= event.capacity) {
      toast.error("Event is full");
      setIsUpdating(false);
      return;
    }

    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName || "",
          email: data.email,
          phoneNumber: data.phoneNumber,
          eventId: event.id,
          paymentType: data.paymentType,
        }),
      });

      const responseData = await response.json();

      if (response.status === 201) {
        let qrCode = null;
        if (data.paymentType === "CARD") {
          qrCode = generateQRCodeURL(
            `${data.firstName} ${data.lastName}`.trim(),
            eventDate,
          );
        }

        reset();
        incrementRegistrationCount();
        toast.success("Registration successful!");

        // Call the success callback
        onRegistrationSuccess(
          {
            firstName: data.firstName,
            lastName: data.lastName || "",
            email: data.email,
            eventId: event.id,
            ...responseData,
          },
          qrCode,
        );
      } else if (response.status === 409) {
        setDuplicateEmail(data.email);
        setShowDuplicateModal(true);
      } else {
        toast.error(
          responseData.message || "Registration failed. Please try again.",
        );
      }
    } catch (err) {
      toast.error("An error occurred during registration. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGuestWaitingList = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    // Validate form data
    if (!getValues("firstName") || !getValues("email")) {
      toast.error("Please fill in required fields");
      setIsUpdating(false);
      return;
    }

    try {
      const response = await fetch("/api/waitinglist/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: getValues("firstName"),
          lastName: getValues("lastName") || "",
          email: getValues("email"),
          phoneNumber: getValues("phoneNumber") || "",
          eventId: event.id,
          paymentType: getValues("paymentType"),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onWaitingListSuccess();
        toast.success("You've been added to the waiting list!");
      } else {
        // Check if error is related to already being on waiting list
        if (
          data.message &&
          data.message.includes("already on the waiting list")
        ) {
          setDuplicateEmail(getValues("email"));
          setShowDuplicateModal(true);
        } else {
          const errorMessage = data.message || "Failed to join waiting list";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.error("Failed to join waiting list. Please try again later.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center">
        <button
          onClick={onBack}
          className="mr-3 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="text-xl font-bold">
          {event._count.Registration >= event.capacity
            ? "Join Waiting List"
            : "Guest Registration"}
        </h3>
      </div>
      <form
        onSubmit={
          event._count.Registration >= event.capacity
            ? handleGuestWaitingList
            : handleSubmit(handleGuestRegistration)
        }
        className="space-y-5"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            First Name <span className="text-red-300">*</span>
          </label>
          <input
            type="text"
            {...register("firstName")}
            className={`w-full rounded-lg border ${
              errors.firstName ? "border-red-300" : "border-white/20"
            } bg-white/10 p-3 text-white placeholder-white/50 focus:border-white/40 focus:ring focus:ring-white/20`}
            placeholder="Your first name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-300">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Last Name</label>
          <input
            type="text"
            {...register("lastName")}
            className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder-white/50 focus:border-white/40 focus:ring focus:ring-white/20"
            placeholder="Your last name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Email <span className="text-red-300">*</span>
          </label>
          <input
            type="email"
            {...register("email")}
            className={`w-full rounded-lg border ${
              errors.email ? "border-red-300" : "border-white/20"
            } bg-white/10 p-3 text-white placeholder-white/50 focus:border-white/40 focus:ring focus:ring-white/20`}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Phone Number <span className="text-red-300">*</span>
          </label>
          <input
            type="tel"
            {...register("phoneNumber")}
            className={`w-full rounded-lg border ${
              errors.phoneNumber ? "border-red-300" : "border-white/20"
            } bg-white/10 p-3 text-white placeholder-white/50 focus:border-white/40 focus:ring focus:ring-white/20`}
            placeholder="Your phone number"
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-300">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            Payment Method <span className="text-red-300">*</span>
          </label>
          <PaymentMethodSelector register={register} />
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-center font-medium text-white transition-all hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-70"
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
                Processing...
              </span>
            ) : (
              "Register for Event"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
