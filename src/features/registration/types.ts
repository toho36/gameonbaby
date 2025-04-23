import { Event } from "../events/types";

export interface RegistrationFormValues {
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
  paymentType: "CARD" | "CASH" | "QR";
  eventId: string;
}

export interface RegistrationSuccessProps {
  registration: {
    firstName: string;
    lastName: string;
    email: string;
    eventId: string;
  };
  event: Event;
  eventDate: string;
  qrCode: string | null;
  onClose: () => void;
}
