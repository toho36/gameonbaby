"use server";
// server/service/emailService.ts
import { Resend } from "resend";
import { EmailTemplate, WaitingListPromotionTemplate } from "~/shared";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
export async function sendRegistrationEmail(
  toEmail: string,
  firstName: string,
  qrCodeUrl: string,
  eventDate: string,
  eventTime?: string,
  eventLocation?: string,
  eventTitle?: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@gameon.baby",
      to: [toEmail],
      subject: "Your Registration Confirmation - GameOn Event",
      react: EmailTemplate({
        firstName,
        qrCodeUrl,
        eventDate,
        eventTime,
        eventLocation,
        eventTitle,
      }),
    });

    if (error) {
      throw new Error("Failed to send email");
    }

    return data;
  } catch (error) {
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
      throw new Error("Failed to send promotion email");
    }

    return data;
  } catch (error) {
    throw error;
  }
}
