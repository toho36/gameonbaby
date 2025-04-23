"use client";
import React, { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegistrationFormValues } from "~/features/registration/types";
import { RegistrationFormSchema } from "~/features/registration/validation";
import { Event } from "~/features/events/types";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";
import useRegistrationStatus from "~/features/registration/hooks/useRegistrationStatus";

// Custom hooks
import usePaymentPreference from "~/features/registration/hooks/usePaymentPreference";
import useUserProfile from "~/shared/hooks/useUserProfile";

// Components
import GuestView from "./GuestView";
import GuestRegistrationForm from "./GuestRegistrationForm";
import GuestRegistrationSuccess from "./GuestRegistrationSuccess";
import AuthenticatedUserView from "./AuthenticatedUserView";
import RegistrationSuccess from "./RegistrationSuccess";
import WaitingListSuccess from "./WaitingListSuccess";
import DuplicateRegistrationModal from "./DuplicateRegistrationModal";

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
  const [paymentTypeSelected, setPaymentTypeSelected] =
    useState<string>("CARD");
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

  const { isLoading: userProfileLoading, fetchUserProfile } =
    useUserProfile(user);
  const profileImage = user?.picture || null;

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
      paymentType: "QR",
      eventId,
    },
  });

  // Initialize the store with the event registration count and capacity
  useEffect(() => {
    initialize(event._count.Registration, event.capacity);
  }, [initialize, event._count.Registration, event.capacity]);

  // Update the payment type based on user preference immediately when it's fetched
  useEffect(() => {
    if (paymentPreference) {
      setValue("paymentType", paymentPreference as "QR" | "CARD" | "CASH");
      console.log(
        "Setting payment type from user preference:",
        paymentPreference,
      );
    }
  }, [paymentPreference, setValue]);

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
    console.log(
      "Registration success with payment type:",
      registration.paymentType,
    );
    setPaymentTypeSelected(registration.paymentType || "QR");
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
    setPaymentTypeSelected("QR");
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
        paymentType={paymentTypeSelected}
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
