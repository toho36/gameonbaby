"use client";
import { useState } from "react";
import { createRegistration } from "~/actions/actions";
import { sendRegistrationEmail } from "~/server/service/emailService";

const eventLocation = "Sportovní hala TJ JM Chodov, Mírového hnutí 2137";

function generateQRCodeURL(name: string, eventDate: string) {
  const paymentString = `SPD*1.0*ACC:CZ9130300000001628400020*RN:VU LOAN TIKOVSKA*AM:150*CC:CZK*MSG:GameOn ${name} for event on ${eventDate}`;
  const encodedPaymentString = encodeURIComponent(paymentString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedPaymentString}`;
}

interface RegistrationFormProps {
  eventId: string;
  eventDate?: string;
  eventPrice?: number;
}

export default function RegistrationForm({
  eventId,
  eventDate = "26.10. 18:15-21:15",
  eventPrice = 150,
}: RegistrationFormProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phoneNumber: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formDataObj = new FormData(event.currentTarget);
    const firstName = formDataObj.get("first_name") as string;
    const email = formDataObj.get("email") as string;
    const phoneNumber = formDataObj.get("phone_number") as string;

    setFormData({ firstName, email, phoneNumber });

    // Add the event ID to the form data
    formDataObj.append("event_id", eventId);

    const qrCode = generateQRCodeURL(firstName, eventDate);
    const response = await createRegistration(formDataObj);

    if (response.success) {
      setSuccess("Registration completed successfully!");
      await sendRegistrationEmail(email, firstName, qrCode, eventDate);
      setQrCodeUrl(qrCode);
      setIsRegistered(true);
    } else {
      setError(response.message ?? "Registration failed. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded bg-white p-4 shadow-md">
      {!isRegistered ? (
        <>
          <h2 className="mb-4 text-2xl font-bold">
            GameOn Volleyball Registrace
          </h2>
          <h3>
            Kde: {eventLocation}
            <br />
            Vstupné : {eventPrice}Kč
          </h3>
          <br />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jméno
              </label>
              <input
                type="text"
                name="first_name"
                required
                className="w-full rounded border border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded border border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefoní číslo
              </label>
              <input
                type="tel"
                name="phone_number"
                className="w-full rounded border border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Způsob platby
              </label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="payment_type"
                    value="CARD"
                    required
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">QR</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="payment_type"
                    value="CASH"
                    required
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Hotově</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded bg-blue-600 p-2 text-white transition hover:bg-blue-700"
            >
              Register
            </button>
          </form>
          {success && <p className="mt-4 text-green-600">{success}</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </>
      ) : (
        <div className="mt-4 text-center">
          <h2>Prosíme ověřte si své údaje</h2>
          <p className="mt-2 text-sm">
            <strong> email:</strong> {formData.email} <br />
            <strong>tel. číslo:</strong> {formData.phoneNumber}
          </p>
          <p className="mt-2">
            Děkujeme za registraci na událost GameOn Volleyball, která se koná{" "}
            <br />
            <strong>{eventDate}</strong>
            <br />
            <strong>ve {eventLocation}</strong>.<br />
            <br />
            Pro potvrzení účasti prosíme o platbu prostřednictvím následujícího
            QR.
            <br />
            Každý QR kód je ojedinělý.
          </p>
          {qrCodeUrl && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="QR Code for Payment"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          )}
          <p className="mt-4">
            Sledujte nás na{" "}
            <a
              href="https://instagram.com/gameon.vb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              instagram.com/gameon.vb
            </a>
          </p>
          <p className="mt-2">
            Jestli jste neobdrželi email prosíme kontaktujte nás.
          </p>
          <strong>Kontakt:</strong> 792 397 669
        </div>
      )}
    </div>
  );
}
