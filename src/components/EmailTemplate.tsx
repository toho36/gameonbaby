/* eslint-disable @next/next/no-img-element */
// components/EmailTemplate.tsx

interface EmailTemplateProps {
  firstName: string;
  qrCodeUrl: string;
  eventDate: string;
}

export function EmailTemplate({
  firstName,
  qrCodeUrl,
  eventDate,
}: EmailTemplateProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: "#333",
        textAlign: "center", // Center-align text and elements
        padding: "20px", // Optional padding for spacing
      }}
    >
      <img
        src="https://i.ibb.co/3BBgQf7/Game-On.png"
        alt="Game-on-logo"
        style={{
          maxWidth: "200px",
          height: "auto",
          margin: "0 auto",
          display: "block",
        }}
      />
      <br />
      <br />
      <strong>Zdravíme {firstName},</strong>
      <br />
      <br />
      Děkujeme za registraci na událost GameOn Volleyball, která se koná{" "}
      <strong>{eventDate}</strong>
      <br />
      <strong>ve sportovní hale TJ JM Chodov, Mírového hnutí 2137.</strong>
      <br />
      Pro potvrzení účasti prosíme o platbu prostřednictvím následujícího QR
      kódu. Každý QR kód je ojedinělý.
      <br />
      <br />
      <img
        src={qrCodeUrl}
        alt="QR Code"
        style={{
          maxWidth: "200px",
          height: "auto",
          margin: "0 auto",
          display: "block",
        }}
      />
      <br />
      <br />
      Pokud jste zvolili platbu hotově na místě, QR kód můžete ignorovat. V
      případě, že potřebujete registraci <strong>zrušit</strong>, kontaktujte
      nás prosím na Instagramu.
      <br />
      <br />
      <strong>Děkujeme za zájem!</strong>
      <br />
      <br />
      <em>GameOn Team</em>
      <br />
      <br />
      Sledujte nás na Instagramu!
      <br />
      <a
        href="https://www.instagram.com/gameon.vb"
        target="_blank"
        style={{ textDecoration: "none" }}
      >
        <img
          src="https://ci3.googleusercontent.com/meips/ADKq_NaXPVlF2XGjya2fUzgubUiw-IJofUPsh34YksURrU1JImhp00-dfyFUHn88T9MJp1x5-S4Vh4r7B3VMhWUugaMUsFmIiw=s0-d-e1-ft#https://i.alza.cz/Foto/ImgGalery/Image/ig_1.png"
          alt="Instagram"
          style={{
            maxWidth: "50px",
            height: "auto",
            display: "inline-block",
            verticalAlign: "middle", // Align center with text
          }}
        />
      </a>
      <br />
      <br />
      <strong>Kontakt:</strong> 792 397 669
      <br />
      <br />
    </div>
  );
}
