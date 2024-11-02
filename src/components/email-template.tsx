// components/email-template.tsx
import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  qrCodeUrl: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  qrCodeUrl,
}) => (
  <div>
    <h1>Welcome, {firstName}!</h1>
    <p>Here is your QR code for registration:</p>
    {/* Replace <Image /> with <img /> */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={qrCodeUrl} alt="QR Code" width={200} height={200} />
    <p>Show this QR code at the event entrance.</p>
  </div>
);
