"use client";

import { useState, useEffect, useCallback } from "react";

export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  eventId: string;
  userId: string | null;
  paid: boolean;
  paymentType: string;
  registrationDate: string;
  [key: string]: unknown;
}

export interface WaitingList {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  eventId: string;
  userId: string | null;
  paymentType: string;
  joinedAt: string;
  [key: string]: unknown;
}

interface RegistrationStatusResponse {
  success: boolean;
  registration: Registration | null;
}

interface WaitingListStatusResponse {
  success: boolean;
  waitingList: WaitingList | null;
}

export default function useRegistrationStatus(
  eventId: string,
  userId?: string | null,
) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOnWaitingList, setIsOnWaitingList] = useState(false);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(
    null,
  );
  const [userWaitingList, setUserWaitingList] = useState<WaitingList | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const checkUserRegistration = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/registration-status`,
      );
      const data = (await response.json()) as RegistrationStatusResponse;
      if (data.success && data.registration) {
        setUserRegistration(data.registration);
        setIsRegistered(true);
      }
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const checkUserWaitingList = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/waitinglist-status`);
      const data = (await response.json()) as WaitingListStatusResponse;
      if (data.success && data.waitingList) {
        setUserWaitingList(data.waitingList);
        setIsOnWaitingList(true);
      }
    } catch {
      // Handle error silently
    }
  }, [eventId]);

  useEffect(() => {
    if (userId) {
      void checkUserRegistration();
      void checkUserWaitingList();
    } else {
      setIsLoading(false);
    }
  }, [eventId, userId, checkUserRegistration, checkUserWaitingList]);

  const resetStatus = () => {
    setIsRegistered(false);
    setIsOnWaitingList(false);
    setUserRegistration(null);
    setUserWaitingList(null);
  };

  return {
    isRegistered,
    isOnWaitingList,
    userRegistration,
    userWaitingList,
    isLoading: isLoading,
    resetStatus,
    setIsRegistered,
    setUserRegistration,
    setIsOnWaitingList,
    setUserWaitingList,
  };
}
