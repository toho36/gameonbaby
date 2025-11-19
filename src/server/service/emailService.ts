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
  eventPrice?: number,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@gameonvb.cz",
      to: [toEmail],
      subject: "Your Registration Confirmation - GameOn Event",
      react: EmailTemplate({
        firstName,
        qrCodeUrl,
        eventDate,
        eventTime,
        eventLocation,
        eventTitle,
        eventPrice,
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
  qrCodeUrl?: string,
  eventPrice?: number,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@gameonvb.cz",
      to: [toEmail],
      subject: "Good News! You're Now Registered for the Event",
      react: WaitingListPromotionTemplate({
        firstName,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        paymentType,
        qrCodeUrl,
        eventPrice,
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
