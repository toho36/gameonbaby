"use client";
import { useState, useEffect, useRef } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { createRegistration } from "~/actions/actions";
import { sendRegistrationEmail } from "~/server/service/emailService";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import CheckRegistrationStatus from "./CheckRegistrationStatus";
import UnregisterButton from "./UnregisterButton";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegistrationFormSchema,
  RegistrationFormValues,
} from "~/components/validations";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="relative mx-auto my-6 w-full max-w-md transform p-4 transition-all duration-300 ease-in-out">
        <div className="relative flex flex-col rounded-xl border border-white/20 bg-gradient-to-br from-purple-900 to-indigo-900 p-6 text-white shadow-xl">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-amber-400"
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
              </div>
              <h3 className="text-xl font-bold text-white">
                Already Registered
              </h3>
            </div>
            <button
              className="ml-auto rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
          <div className="mb-6 rounded-lg bg-white/10 p-4">
            <p className="text-white/90">
              This email <span className="font-bold text-white">{email}</span>{" "}
              is already registered for this event.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              className="rounded-lg bg-white/20 px-5 py-2.5 font-medium text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
              type="button"
              onClick={onClose}
            >
              Close
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
  const [isOnWaitingList, setIsOnWaitingList] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState<string>("CARD");
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [userWaitingList, setUserWaitingList] = useState<any>(null);
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showFriendForm, setShowFriendForm] = useState(false);
  const [friendRegistrationSuccess, setFriendRegistrationSuccess] =
    useState(false);
  const [friendName, setFriendName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  // Add a ref for the friend registration form
  const friendFormRef = useRef<HTMLFormElement>(null);

  // Get methods from the registration store
  const { incrementRegistrationCount, initialize } =
    useEventRegistrationStore();

  // Debug state for troubleshooting rendering issues
  useEffect(() => {
    console.log("Registration state updated:", {
      isRegistered,
      isAuthenticated,
      userRegistration,
      showGuestForm,
    });
  }, [isRegistered, isAuthenticated, userRegistration, showGuestForm]);

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
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
      eventId,
    },
  });

  // Initialize the store with the event registration count and capacity
  useEffect(() => {
    initialize(event._count.Registration, event.capacity);
  }, [initialize, event._count.Registration, event.capacity]);

  // Reset the form state after unregistering
  const resetFormState = () => {
    setIsRegistered(false);
    setIsOnWaitingList(false);
    setUserRegistration(null);
    setUserWaitingList(null);
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Check if user is already registered for this event
      checkUserRegistration();
      // Check if user is on waiting list
      checkUserWaitingList();
      // Fetch user's payment preference
      fetchPaymentPreference();
      // Fetch user's profile
      fetchUserProfile();
    }
  }, [isAuthenticated, user?.id]);

  async function fetchUserProfile() {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (data.success) {
        setProfileImage(data.user.image);

        // Update form values
        if (data.user.name) {
          const nameParts = data.user.name.split(" ");
          setValue("firstName", nameParts[0] || "");
          setValue("lastName", nameParts.slice(1).join(" ") || "");
        } else if (user?.given_name) {
          setValue("firstName", user.given_name);
          setValue("lastName", user?.family_name || "");
        }

        if (data.user.email || user?.email) {
          setValue("email", data.user.email || user?.email || "");
        }

        if (data.user.phoneNumber) {
          setValue("phoneNumber", data.user.phoneNumber);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

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

  async function checkUserWaitingList() {
    try {
      const response = await fetch(`/api/events/${eventId}/waitinglist-status`);
      const data = await response.json();
      if (data.success && data.waitingList) {
        setUserWaitingList(data.waitingList);
        setIsOnWaitingList(true);
      }
    } catch (error) {
      console.error("Error checking waiting list status:", error);
    }
  }

  const handleGuestRegistration = async (data: RegistrationFormValues) => {
    setIsUpdating(true);
    console.log("Starting guest registration process");

    if (event._count.Registration >= event.capacity) {
      toast.error("Event is full");
      setIsUpdating(false);
      return;
    }

    try {
      console.log("Submitting registration data:", data);
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
      console.log("Registration response:", response.status, responseData);

      // For successful registration (201 Created)
      if (response.status === 201) {
        // Generate QR code if payment type is CARD
        if (data.paymentType === "CARD") {
          const qrCode = generateQRCodeURL(
            `${data.firstName} ${data.lastName}`.trim(),
            eventDate,
          );
          setQrCodeUrl(qrCode);
          console.log("QR code generated");
        }

        // Important - clear form data and update success states
        reset();
        incrementRegistrationCount();
        toast.success("Registration successful!");

        // Set required state variables
        setUserRegistration({
          firstName: data.firstName,
          lastName: data.lastName || "",
          email: data.email,
          eventId: event.id,
          ...responseData,
        });

        // Clear form display
        setShowGuestForm(false);

        // Clear any previous errors
        setError(null);
        setSuccess("Registration successful!");

        // MOST IMPORTANT - force the component to re-render with success message
        setIsRegistered(true);

        // Log final state
        console.log("Registration successful, isRegistered set to true");
      } else if (response.status === 409) {
        setShowDuplicateModal(true);
      } else {
        setError(
          responseData.message || "Registration failed. Please try again.",
        );
        toast.error(responseData.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred during registration. Please try again.");
      toast.error("Registration failed");
    } finally {
      setIsUpdating(false);
    }
  };

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
        // Update the registration count in the store
        incrementRegistrationCount();

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

  const handleJoinWaitingList = async () => {
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

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
        setIsOnWaitingList(true);
        toast.success("You've been added to the waiting list!");
      } else {
        console.log("Waiting list registration failed:", data);
        toast.error(
          data.error || data.message || "Failed to join waiting list",
        );
      }
    } catch (error) {
      console.error("Error joining waiting list:", error);
      toast.error("Failed to join waiting list");
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
          paymentType: paymentPreference,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsOnWaitingList(true);
        toast.success("You've been added to the waiting list!");
      } else {
        console.error("Waiting list error:", data);

        // Check if error is related to already being on waiting list
        if (
          data.message &&
          data.message.includes("already on the waiting list")
        ) {
          setShowDuplicateModal(true);
        } else {
          const errorMessage = data.message || "Failed to join waiting list";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error joining waiting list:", error);
      toast.error("Failed to join waiting list. Please try again later.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFriendRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    // Get the form values using the form element directly from the event
    const form = e.target as HTMLFormElement;
    const friendFirstName = form.friendFirstName.value.trim();
    const friendLastName = form.friendLastName.value.trim();

    if (!friendFirstName) {
      toast.error("Friend's first name is required");
      return;
    }

    // Check if friend's name is the same as user's name
    if (
      user?.given_name &&
      user?.family_name &&
      friendFirstName.toLowerCase() === user.given_name.toLowerCase() &&
      friendLastName.toLowerCase() === user.family_name.toLowerCase()
    ) {
      toast.error("You cannot register yourself again");
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: friendFirstName,
          lastName: friendLastName,
          email: user?.email, // Use the authenticated user's email
          phoneNumber: userRegistration?.phoneNumber, // Use the authenticated user's phone number
          eventId: event.id,
          paymentType: paymentPreference,
          registeredByUserId: user?.id, // Track who registered this person
        }),
      });

      const data = await response.json();

      if (response.ok) {
        incrementRegistrationCount();
        setFriendRegistrationSuccess(true);
        setFriendName(`${friendFirstName} ${friendLastName}`.trim());
        toast.success("Friend successfully registered!");

        // Clear form inputs manually instead of using reset()
        try {
          // Only attempt to reset if the form is still in the DOM
          if (form && typeof form.reset === "function") {
            form.reset();
          }
        } catch (resetError) {
          console.log("Note: Form reset skipped");
        }
      } else {
        if (data.message && data.message.includes("already registered")) {
          setShowDuplicateModal(true);
        } else {
          toast.error(data.message || "Failed to register friend");
        }
      }
    } catch (error) {
      console.error("Error registering friend:", error);
      toast.error("Failed to register friend");
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  // Show guest registration success message
  if (isRegistered && !isAuthenticated) {
    console.log("Rendering guest registration success message");
    return (
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 p-6 shadow-xl backdrop-blur-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-400"
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
          <h3 className="text-xl font-bold text-white">
            Registration Successful!
          </h3>
          <p className="mt-2 text-white/80">
            Thank you for registering for the event. Your spot has been secured.
          </p>
          <div className="mt-4 rounded-lg bg-white/10 p-3 text-left">
            <p className="mb-1 text-sm text-white/70">Event Details:</p>
            <p className="font-medium text-white">{event.title}</p>
            <p className="text-sm text-white/90">{eventDate}</p>
            {event.place && (
              <p className="text-sm text-white/90">{event.place}</p>
            )}
          </div>
        </div>

        {qrCodeUrl && (
          <div className="mb-6 flex flex-col items-center">
            <h4 className="mb-3 text-lg font-semibold text-white">
              Your Payment QR Code
            </h4>
            <div className="rounded-lg bg-white p-4">
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="h-48 w-48"
              />
            </div>
            <p className="mt-2 text-center text-sm text-white/80">
              Please make your payment of {event.price} Kč by scanning this QR
              code.
            </p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => {
              resetFormState();
              setQrCodeUrl(null);
              setSuccess(null);
              setShowGuestForm(true);
            }}
            className="rounded-lg bg-white/20 px-4 py-2 font-medium text-white transition hover:bg-white/30"
          >
            Register Another Person
          </button>
        </div>
      </div>
    );
  }

  // Show authenticated user success message
  if (isRegistered && isAuthenticated) {
    const downloadQRCode = () => {
      const link = document.createElement("a");
      link.href = qrCodeUrl || "";
      link.download = `gameon-payment-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
                onClick={() => setShowFriendForm(true)}
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
                    onClick={() => setShowFriendForm(false)}
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

                <form
                  ref={friendFormRef}
                  onSubmit={handleFriendRegistration}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Friend's First Name{" "}
                      <span className="text-red-300">*</span>
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
                  <h4 className="font-bold text-green-300">
                    Friend Registered!
                  </h4>
                </div>

                <p className="mb-3 text-sm text-white/90">
                  {friendName} has been successfully registered for this event.
                  They'll be using your contact details.
                </p>

                <button
                  onClick={() => {
                    setShowFriendForm(true);
                    setFriendRegistrationSuccess(false);
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
              <UnregisterButton
                eventId={eventId}
                refreshForm={resetFormState}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show waiting list success if user is on waiting list
  if (isOnWaitingList) {
    return (
      <div className="rounded-xl border border-white/20 bg-gradient-to-br from-purple-900/70 to-indigo-900/70 p-6 text-white shadow-lg backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="rounded-full bg-indigo-500/20 p-4">
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
                  className="h-10 w-10 text-indigo-400"
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
              )}
            </div>
            <h3 className="text-2xl font-bold text-white">
              You're on the Waiting List!
            </h3>
            <p className="text-lg text-white/90">
              We'll notify you if a spot becomes available.
            </p>
          </div>

          <div className="mt-4 w-full rounded-lg border border-white/20 bg-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/30">
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <span className="font-medium">Email Notification</span>
              </div>
              <span className="text-indigo-300">Enabled</span>
            </div>
          </div>

          <div className="mt-6 w-full">
            <div className="flex items-center justify-center">
              <UnregisterButton
                eventId={eventId}
                refreshForm={resetFormState}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-logged in user view with waiting list option if event is full
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-white/20 bg-gradient-to-br from-purple-900/70 to-indigo-900/70 p-6 text-white shadow-lg backdrop-blur-sm">
        {!showGuestForm ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="mb-4 text-center">
              <h3 className="mb-2 text-xl font-bold">Join the Event</h3>
              <p className="text-white/80">
                {event._count.Registration >= event.capacity
                  ? "Event is full, but you can join the waiting list"
                  : "Register for this exciting event"}
              </p>
            </div>
            <button
              onClick={() => router.push("/api/auth/login")}
              className="w-full rounded-lg bg-white/20 px-5 py-3.5 font-medium text-white transition-all hover:bg-white/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-purple-900"
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                {event._count.Registration >= event.capacity
                  ? "Sign In to Join Waiting List"
                  : "Sign In to Register"}
              </div>
            </button>
            <button
              onClick={() => setShowGuestForm(true)}
              className="w-full rounded-lg border border-white/20 bg-transparent px-5 py-3.5 font-medium text-white transition-all hover:bg-white/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {event._count.Registration >= event.capacity
                  ? "Join Waiting List as Guest"
                  : "Register as Guest"}
              </div>
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-5 flex items-center">
              <button
                onClick={() => setShowGuestForm(false)}
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
                <label className="mb-1.5 block text-sm font-medium">
                  Last Name
                </label>
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
                  <p className="mt-1 text-sm text-red-300">
                    {errors.email.message}
                  </p>
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
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-3 transition-all hover:border-white/40 hover:bg-white/20">
                    <input
                      type="radio"
                      {...register("paymentType")}
                      value="CARD"
                      defaultChecked
                      className="h-4 w-4 border-white/40 text-white focus:ring-white/20"
                    />
                    <div className="ml-3">
                      <span className="block font-medium">QR Code Payment</span>
                      <span className="text-xs text-white/70">
                        Pay via bank transfer
                      </span>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-3 transition-all hover:border-white/40 hover:bg-white/20">
                    <input
                      type="radio"
                      {...register("paymentType")}
                      value="CASH"
                      className="h-4 w-4 border-white/40 text-white focus:ring-white/20"
                    />
                    <div className="ml-3">
                      <span className="block font-medium">Cash on Site</span>
                      <span className="text-xs text-white/70">
                        Pay when you arrive
                      </span>
                    </div>
                  </label>
                </div>
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
        )}

        {/* Duplicate Registration Modal */}
        <DuplicateRegistrationModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          email={getValues("email")}
        />
      </div>
    );
  }

  // Logged in user view with waiting list option if event is full
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
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-4 transition-all hover:border-white/40 hover:bg-white/20">
              <input
                type="radio"
                name="payment_preference"
                value="CARD"
                checked={paymentPreference === "CARD"}
                onChange={() => setPaymentPreference("CARD")}
                className="h-5 w-5 border-white/40 text-white focus:ring-white/20"
              />
              <div className="ml-3">
                <span className="block font-medium">QR Code Payment</span>
                <span className="text-xs text-white/70">
                  Pay via bank transfer
                </span>
              </div>
            </label>
            <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-4 transition-all hover:border-white/40 hover:bg-white/20">
              <input
                type="radio"
                name="payment_preference"
                value="CASH"
                checked={paymentPreference === "CASH"}
                onChange={() => setPaymentPreference("CASH")}
                className="h-5 w-5 border-white/40 text-white focus:ring-white/20"
              />
              <div className="ml-3">
                <span className="block font-medium">Cash on Site</span>
                <span className="text-xs text-white/70">
                  Pay when you arrive
                </span>
              </div>
            </label>
          </div>
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

      {/* Duplicate Registration Modal */}
      <DuplicateRegistrationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        email={getValues("email")}
      />
    </div>
  );
}
