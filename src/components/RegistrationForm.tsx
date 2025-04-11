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

// Modal Component
function DuplicateRegistrationModal({
  isOpen,
  onClose,
  email,
}: {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50">
      <div className="relative mx-auto my-6 w-full max-w-md">
        <div className="relative flex flex-col rounded-lg border-0 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-start justify-between rounded-t">
            <h3 className="text-lg font-semibold text-gray-900">
              Registration Already Exists
            </h3>
            <button
              className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold text-gray-400"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="relative mb-4 flex-auto">
            <p className="text-gray-600">
              There's already a registration with this email and name
              combination. If you'd like to register someone else using the
              email <span className="font-semibold">{email}</span>, please use a
              different name.
            </p>
          </div>
          <div className="flex items-center justify-end rounded-b">
            <button
              className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              type="button"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

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
        setIsRegistered(true);
        toast.success(
          "Registration successful! Check your email for confirmation.",
        );

        // Send confirmation email if payment type is CARD
        if (paymentPreference === "CARD" && user.email) {
          try {
            const name = user.given_name || user.family_name || "User";
            const qrUrl = generateQRCodeURL(name, eventDate);

            await sendRegistrationEmail(user.email, name, qrUrl, eventDate);
          } catch (emailError) {
            console.error("Failed to send registration email:", emailError);
          }
        }
      } else {
        console.log("Registration failed:", data);

        // Check if the error is related to duplicate registration
        if (data.message && data.message.includes("already registered")) {
          // Show the duplicate registration modal
          setShowDuplicateModal(true);
        } else {
          toast.error(data.error || data.message || "Registration failed");
        }
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Registration failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGuestRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    if (event._count.Registration >= event.capacity) {
      toast.error("Event is full");
      setIsUpdating(false);
      return;
    }

    // Validate form data
    if (!formData.firstName || !formData.email) {
      toast.error("Please fill in required fields");
      setIsUpdating(false);
      return;
    }

    console.log("Attempting to register:", {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      eventId: event.id,
      paymentType: paymentPreference,
    });

    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName || "",
          email: formData.email,
          phoneNumber: formData.phoneNumber || "",
          eventId: event.id,
          paymentType: paymentPreference,
        }),
      });

      const data = await response.json();
      console.log("Registration response:", { status: response.status, data });

      if (response.ok) {
        setIsRegistered(true);
        toast.success(
          "Registration successful! Check your email for confirmation.",
        );

        // Check if we have QR code data in the response
        let qrUrl = data.qrCodeData;

        // Generate one if not provided but payment type is CARD
        if (!qrUrl && paymentPreference === "CARD") {
          const name = `${formData.firstName} ${formData.lastName}`.trim();
          qrUrl = generateQRCodeURL(name, eventDate);
          setQrCodeUrl(qrUrl);
        } else if (qrUrl) {
          setQrCodeUrl(qrUrl);
        }

        // Send confirmation email with QR code if payment type is CARD
        if (paymentPreference === "CARD" && qrUrl) {
          try {
            await sendRegistrationEmail(
              formData.email,
              formData.firstName,
              qrUrl,
              eventDate,
            );
            console.log("Registration email sent successfully");
          } catch (emailError) {
            console.error("Failed to send registration email:", emailError);
            // Don't show this error to the user since registration was successful
          }
        } else {
          // Send a confirmation email without QR code for cash payments
          try {
            await fetch("/api/email/confirmation", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: formData.email,
                firstName: formData.firstName,
                eventDate: eventDate,
                paymentType: "CASH",
              }),
            });
            console.log("Confirmation email sent successfully");
          } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
          }
        }
      } else {
        console.error("Registration error:", data);

        // Check if the error is related to duplicate registration
        if (
          response.status === 409 ||
          (data.message && data.message.includes("already exists"))
        ) {
          // Show the duplicate registration modal
          setShowDuplicateModal(true);
        } else {
          // Display general error
          const errorMessage = data.message || "Registration failed";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Registration failed. Please try again later.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        toast.success(
          "Registration successful! Check your email for confirmation.",
        );

        // Send confirmation email if payment type is CARD
        if (paymentPreference === "CARD" && user.email) {
          try {
            const name = user.given_name || user.family_name || "User";
            const qrUrl = generateQRCodeURL(name, eventDate);

            await sendRegistrationEmail(user.email, name, qrUrl, eventDate);
          } catch (emailError) {
            console.error("Failed to send registration email:", emailError);
          }
        }
      } else {
        toast.error(data.error || data.message || "Registration failed");
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
        <p className="mb-4 text-gray-600">
          You have successfully registered for this event. A confirmation email
          has been sent to your email address.
        </p>

        {qrCodeUrl && (
          <div className="mt-4">
            <h4 className="mb-2 font-medium">Payment QR Code</h4>
            <p className="mb-3 text-sm text-gray-600">
              Scan this QR code to complete your payment. This QR code has also
              been sent to your email.
            </p>
            <div className="flex justify-center">
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="h-64 w-64 rounded-lg border border-gray-200"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Non-logged in user view
  if (!isAuthenticated) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-medium">Register for Event</h3>

        {!showGuestForm ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              To register for this event, you can either:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/api/auth/login")}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700"
              >
                Sign In to Register
              </button>
              <button
                onClick={() => setShowGuestForm(true)}
                className="w-full rounded-md border border-indigo-300 bg-white px-4 py-2 font-medium text-indigo-600 transition hover:bg-indigo-50"
              >
                Register as Guest
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGuestRegistration} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                required
                className="w-full rounded-md border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Your first name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                className="w-full rounded-md border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Your last name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                className="w-full rounded-md border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleFormChange}
                className="w-full rounded-md border border-gray-300 p-2.5 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Your phone number"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Payment Method <span className="text-red-500">*</span>
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

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full rounded-md bg-indigo-600 p-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {isUpdating ? "Registering..." : "Register Now"}
              </button>

              <button
                type="button"
                onClick={() => setShowGuestForm(false)}
                className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-gray-700 transition hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Duplicate Registration Modal */}
        <DuplicateRegistrationModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          email={formData.email}
        />
      </div>
    );
  }

  // Logged in user view
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

      {/* Duplicate Registration Modal */}
      <DuplicateRegistrationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        email={user?.email || ""}
      />
    </div>
  );
}
