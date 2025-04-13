"use server";
// server/service/emailService.ts
import { Resend } from "resend";
import { EmailTemplate } from "~/components/EmailTemplate";
import { WaitingListPromotionTemplate } from "~/components/WaitingListPromotionTemplate";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
export async function sendRegistrationEmail(
  toEmail: string,
  firstName: string,
  qrCodeUrl: string,
  eventDate: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@gameon.baby",
      to: [toEmail],
      subject: "Your Registration QR Code",
      react: EmailTemplate({ firstName, qrCodeUrl, eventDate }), // Pass eventDate here
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }

    return data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

export async function sendWaitingListPromotionEmail(
  toEmail: string,
  firstName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string,
  paymentType: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@gameon.baby",
      to: [toEmail],
      subject: "Good News! You're Now Registered for the Event",
      react: WaitingListPromotionTemplate({
        firstName,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        paymentType,
      }),
    });

    if (error) {
      console.error("Error sending promotion email:", error);
      throw new Error("Failed to send promotion email");
    }

    return data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}
