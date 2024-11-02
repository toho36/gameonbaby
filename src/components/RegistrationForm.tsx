// components/RegistrationForm.tsx
"use client";
import { createRegistration } from "~/actions/actions";
import { useState } from "react";
import { sendRegistrationEmail } from "~/server/service/emailService"; // Import the new email service

// Define the event date globally to use in QR code generation
const eventDate = "26.10. 18:15-21:15"; // Adjust this date accordingly

// QR Code URL generator function
function generateQRCodeURL(name: string) {
  const paymentString = `SPD*1.0*ACC:CZ9130300000001628400020*RN:VU LOAN TIKOVSKA*AM:150*CC:CZK*MSG:GameOn ${name} for event on ${eventDate}`;
  const encodedPaymentString = encodeURIComponent(paymentString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedPaymentString}`;
}

export default function RegistrationForm() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("first_name") as string;
    const email = formData.get("email") as string;

    const qrCode = generateQRCodeURL(firstName);
    setQrCodeUrl(qrCode);
    // Send the email with the QR code
    if (qrCode) {
      await sendRegistrationEmail(email, firstName, qrCode);
    }
    console.log("qrcode", qrCodeUrl);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded bg-white p-4 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">
        26.10 18:15-21:15 GameOn Volleyball Registrace
      </h2>
      <h3>
        Kde: Sportovní hala TJ JM Chodov, Mírového hnutí 2137
        <br />
        Vstupné : 150Kč
      </h3>
      <br />
      <form
        action={createRegistration}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
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
      {qrCodeUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">QR Code for Payment:</h3>
          <h2>
            QR Code: potvrzení registrace platbou QR a email pro potvrzení
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt="QR Code for Payment"
            width={200}
            height={200}
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}
