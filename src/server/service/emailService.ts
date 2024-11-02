"use server";
// server/service/emailService.ts
import { Resend } from "resend";
import { EmailTemplate } from "~/components/EmailTemplate";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function sendRegistrationEmail(
  toEmail: string,
  firstName: string,
  qrCodeUrl: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@gameon.baby",
      to: [toEmail],
      subject: "Your Registration QR Code",
      react: EmailTemplate({ firstName, qrCodeUrl }),
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
