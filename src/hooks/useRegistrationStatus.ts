import { useState, useEffect } from "react";

interface Registration {
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
  [key: string]: any;
}

interface WaitingList {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  eventId: string;
  userId: string | null;
  paymentType: string;
  joinedAt: string;
  [key: string]: any;
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

  useEffect(() => {
    if (userId) {
      // Only fetch if we have a user ID
      checkUserRegistration();
      checkUserWaitingList();
    } else {
      setIsLoading(false);
    }
  }, [eventId, userId]);

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
      // Handle error silently
    } finally {
      setIsLoading(false);
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
      // Handle error silently
    }
  }

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
