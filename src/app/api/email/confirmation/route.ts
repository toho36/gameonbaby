import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

interface EmailRequest {
  email: string;
  firstName: string;
  eventDate: string;
  paymentType: string;
}

export async function POST(req: Request) {
  try {
    const { email, firstName, eventDate, paymentType } =
      (await req.json()) as EmailRequest;

    if (!email || !firstName || !eventDate) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: "info@gameonvb.cz",
      to: [email],
      subject: "GameOn Event Registration Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <img src="https://i.ibb.co/3BBgQf7/Game-On.png" alt="GameOn Logo" style="max-width: 200px; height: auto; margin: 0 auto; display: block;">
          <h2 style="text-align: center; color: #5a2ca0;">Registration Confirmation</h2>
          <p>Zdravíme ${firstName},</p>
          <p>Děkujeme za registraci na událost GameOn Volleyball, která se koná <strong>${eventDate}</strong> ve sportovní hale TJ JM Chodov, Mírového hnutí 2137.</p>
          <p>Zvolili jste platbu <strong>hotově na místě</strong>. Prosíme, přijďte alespoň 15 minut před začátkem akce, abyste měli dostatek času na zaplacení a registraci.</p>
          <p>V případě, že potřebujete registraci <strong>zrušit</strong>, kontaktujte nás prosím na Instagramu.</p>
          <p><strong>Děkujeme za zájem!</strong></p>
          <p><em>GameOn Team</em></p>
          <div style="text-align: center; margin-top: 20px;">
            <p>Sledujte nás na Instagramu!</p>
            <a href="https://www.instagram.com/gameon.vb" target="_blank" style="text-decoration: none;">
              <img src="https://ci3.googleusercontent.com/meips/ADKq_NaXPVlF2XGjya2fUzgubUiw-IJofUPsh34YksURrU1JImhp00-dfyFUHn88T9MJp1x5-S4Vh4r7B3VMhWUugaMUsFmIiw=s0-d-e1-ft#https://i.alza.cz/Foto/ImgGalery/Image/ig_1.png" alt="Instagram" style="max-width: 50px; height: auto; display: inline-block; vertical-align: middle;">
            </a>
            <p><strong>Kontakt:</strong> 792 397 669</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending confirmation email:", error);
      return NextResponse.json(
        { success: false, message: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in email confirmation API:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
