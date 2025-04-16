"use client";
import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegistrationFormSchema, RegistrationFormValues } from "./validations";
import { Event } from "~/types/Event";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";

// Custom hooks
import useRegistrationStatus from "~/hooks/useRegistrationStatus";
import usePaymentPreference from "~/hooks/usePaymentPreference";
import useUserProfile from "~/hooks/useUserProfile";

// Components
import GuestView from "./registration/GuestView";
import GuestRegistrationForm from "./registration/GuestRegistrationForm";
import GuestRegistrationSuccess from "./registration/GuestRegistrationSuccess";
import AuthenticatedUserView from "./registration/AuthenticatedUserView";
import RegistrationSuccess from "./registration/RegistrationSuccess";
import WaitingListSuccess from "./registration/WaitingListSuccess";

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
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [isNameError, setIsNameError] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState("");
  const router = useRouter();

  // Initialize the store with the event registration count and capacity
  const { initialize } = useEventRegistrationStore();

  // Custom hooks
  const {
    isRegistered,
    isOnWaitingList,
    userRegistration,
    resetStatus,
    setIsRegistered,
    setUserRegistration,
    setIsOnWaitingList,
  } = useRegistrationStatus(eventId, user?.id);

  const { paymentPreference, setPaymentPreference, updatePaymentPreference } =
    usePaymentPreference();

  const { profileImage } = useUserProfile(user);

  // Set up react-hook-form for guest registration
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

  // Load user profile data into form
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.given_name) {
        setValue("firstName", user.given_name);
      }
      if (user.family_name) {
        setValue("lastName", user.family_name);
      }
      if (user.email) {
        setValue("email", user.email);
      }
    }
  }, [isAuthenticated, user, setValue]);

  // Handler for successful registration
  const handleRegistrationSuccess = (
    registration: any,
    qrCode: string | null = null,
  ) => {
    setUserRegistration(registration);
    setIsRegistered(true);
    setQrCodeUrl(qrCode);
    setShowGuestForm(false);
  };

  // Handler for successful waiting list addition
  const handleWaitingListSuccess = () => {
    setIsOnWaitingList(true);
  };

  // Reset form state after unregistering
  const resetFormState = () => {
    resetStatus();
    setQrCodeUrl(null);
    reset();
    setShowGuestForm(false);
  };

  if (isLoading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  // Show guest registration success message
  if (isRegistered && !isAuthenticated) {
    return (
      <GuestRegistrationSuccess
        event={event}
        eventDate={eventDate}
        qrCodeUrl={qrCodeUrl}
        resetFormState={resetFormState}
      />
    );
  }

  // Show authenticated user success message
  if (isRegistered && isAuthenticated) {
    return (
      <RegistrationSuccess
        event={event}
        eventId={eventId}
        qrCodeUrl={qrCodeUrl}
        profileImage={profileImage}
        resetFormState={resetFormState}
        user={user}
        userRegistration={userRegistration}
        paymentPreference={paymentPreference}
      />
    );
  }

  // Show waiting list success if user is on waiting list
  if (isOnWaitingList) {
    return (
      <WaitingListSuccess
        eventId={eventId}
        profileImage={profileImage}
        resetFormState={resetFormState}
      />
    );
  }

  // Non-logged in user view with guest registration form
  if (!isAuthenticated) {
    return showGuestForm ? (
      <GuestRegistrationForm
        event={event}
        eventDate={eventDate}
        onBack={() => setShowGuestForm(false)}
        onRegistrationSuccess={handleRegistrationSuccess}
        onWaitingListSuccess={handleWaitingListSuccess}
      />
    ) : (
      <GuestView
        event={event}
        eventDate={eventDate}
        onGuestRegistrationClick={() => setShowGuestForm(true)}
        email={duplicateEmail}
        showDuplicateModal={showDuplicateModal}
        onCloseDuplicateModal={() => setShowDuplicateModal(false)}
        nameError={isNameError}
        duplicateName={duplicateName}
      />
    );
  }

  // Logged in user view
  return (
    <AuthenticatedUserView
      event={event}
      eventId={eventId}
      eventDate={eventDate}
      paymentPreference={paymentPreference}
      setPaymentPreference={setPaymentPreference}
      updatePaymentPreference={updatePaymentPreference}
      onRegistrationSuccess={handleRegistrationSuccess}
      onWaitingListSuccess={handleWaitingListSuccess}
      user={user}
    />
  );
}
