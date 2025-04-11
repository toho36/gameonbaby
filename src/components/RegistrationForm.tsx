"use client";
import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { createRegistration } from "~/actions/actions";
import { sendRegistrationEmail } from "~/server/service/emailService";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const eventLocation = "Sportovní hala TJ JM Chodov, Mírového hnutí 2137";

function generateQRCodeURL(name: string, eventDate: string) {
  const paymentString = `SPD*1.0*ACC:CZ9130300000001628400020*RN:VU LOAN TIKOVSKA*AM:150*CC:CZK*MSG:GameOn ${name} for event on ${eventDate}`;
  const encodedPaymentString = encodeURIComponent(paymentString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedPaymentString}`;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  capacity: number;
  from: string;
  to: string;
  visible: boolean;
  _count: {
    Registration: number;
  };
}

interface RegistrationFormProps {
  event: Event;
  eventId: string;
  eventDate: string;
}

export default function RegistrationForm({
  event,
  eventId,
  eventDate,
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
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleQuickRegister = async () => {
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    if (event._count.Registration >= event.capacity) {
      toast.error("Event is full");
      return;
    }

    try {
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
        setIsRegistered(true);
        toast.success("Registration successful!");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Registration failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    if (event._count.Registration >= event.capacity) {
      toast.error("Event is full");
      return;
    }

    try {
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
        setIsRegistered(true);
        toast.success("Registration successful!");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Registration failed");
    }
  };

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

  if (isLoading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  if (isRegistered) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-medium">Registration Successful!</h3>
        <p className="text-gray-600">
          You have successfully registered for this event.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 text-lg font-medium">Register for Event</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="payment_preference"
                value="CARD"
                checked={paymentPreference === "CARD"}
                onChange={() => setPaymentPreference("CARD")}
                className="mr-2"
              />
              <span>QR Code Payment</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="payment_preference"
                value="CASH"
                checked={paymentPreference === "CASH"}
                onChange={() => setPaymentPreference("CASH")}
                className="mr-2"
              />
              <span>Cash on Site</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleQuickRegister}
          disabled={isUpdating}
          className="w-full rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isUpdating ? "Registering..." : "Register Now"}
        </button>
      </div>
    </div>
  );
}
