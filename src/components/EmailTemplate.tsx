/* eslint-disable @next/next/no-img-element */
// components/EmailTemplate.tsx

interface EmailTemplateProps {
  firstName: string;
  qrCodeUrl: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventTitle?: string;
}

export function EmailTemplate({
  firstName,
  qrCodeUrl,
  eventDate,
  eventTime = "18:00 - 20:00",
  eventLocation = "Sportovní hala TJ JM Chodov, Mírového hnutí 2137",
  eventTitle = "GameOn Volleyball",
}: EmailTemplateProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: "#333",
        textAlign: "center",
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
      }}
    >
      <img
        src="https://i.ibb.co/G4SS7RhD/gameoncrop.png"
        alt="Game-on-logo"
        style={{
          maxWidth: "200px",
          height: "auto",
          margin: "0 auto 20px",
          display: "block",
        }}
      />

      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{ color: "#5a2ca0", fontSize: "24px", marginBottom: "20px" }}
        >
          Registration Confirmation
        </h1>
        <p style={{ fontSize: "18px", marginBottom: "10px" }}>
          <strong>Zdravíme {firstName},</strong>
        </p>
        <p style={{ lineHeight: "1.6" }}>
          Děkujeme za registraci na událost <strong>{eventTitle}</strong>
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          textAlign: "left",
        }}
      >
        <h2
          style={{ fontSize: "18px", marginBottom: "15px", color: "#5a2ca0" }}
        >
          Event Details:
        </h2>
        <p style={{ marginBottom: "8px" }}>
          <strong>Date:</strong> {eventDate}
        </p>
        <p style={{ marginBottom: "8px" }}>
          <strong>Time:</strong> {eventTime}
        </p>
        <p style={{ marginBottom: "8px" }}>
          <strong>Location:</strong> {eventLocation}
        </p>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <p style={{ marginBottom: "15px" }}>
          Pro potvrzení účasti prosíme o platbu prostřednictvím následujícího QR
          kódu. Každý QR kód je ojedinělý.
        </p>
        <img
          src={qrCodeUrl}
          alt="QR Code"
          style={{
            maxWidth: "200px",
            height: "auto",
            margin: "0 auto",
            display: "block",
            padding: "15px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
      </div>

      <div
        style={{
          borderTop: "1px solid #eee",
          paddingTop: "20px",
          marginTop: "20px",
          color: "#666",
        }}
      >
        <p style={{ marginBottom: "10px" }}>
          Pokud jste zvolili platbu hotově na místě, QR kód můžete ignorovat.
        </p>
        <p style={{ marginBottom: "10px" }}>
          V případě, že potřebujete registraci <strong>zrušit</strong>,
          kontaktujte nás prosím na Instagramu.
        </p>
        <p style={{ marginBottom: "20px" }}>
          <strong>Děkujeme za zájem!</strong>
        </p>
        <p>
          <em>GameOn Team</em>
        </p>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <p style={{ marginBottom: "10px" }}>Sledujte nás na Instagramu!</p>
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
              verticalAlign: "middle",
            }}
          />
        </a>
        <p style={{ marginTop: "10px" }}>
          <strong>Kontakt:</strong> 792 397 669
        </p>
      </div>
    </div>
  );
}
