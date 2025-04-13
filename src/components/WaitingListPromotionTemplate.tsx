import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
  Section,
  Button,
} from "@react-email/components";

interface WaitingListPromotionTemplateProps {
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  paymentType: string;
}

export const WaitingListPromotionTemplate = ({
  firstName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  paymentType,
}: WaitingListPromotionTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Good news! A spot has opened up and you've been moved from the waiting
        list to registered participants.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://gameon.baby/images/logo.png"
            width="150"
            height="150"
            alt="Game On Baby Logo"
            style={logo}
          />
          <Heading style={h1}>You're In!</Heading>

          <Text style={text}>Hello {firstName},</Text>

          <Text style={text}>
            Great news! A spot has opened up for <strong>{eventTitle}</strong>{" "}
            and you've been moved from the waiting list to registered
            participants.
          </Text>

          <Section style={eventDetails}>
            <Text style={eventTitle}>Event Details:</Text>
            <Text style={eventInfo}>Date: {eventDate}</Text>
            <Text style={eventInfo}>Time: {eventTime}</Text>
            <Text style={eventInfo}>Location: {eventLocation}</Text>
            <Text style={eventInfo}>
              Payment Method:{" "}
              {paymentType === "CARD" ? "Card/QR Payment" : "Cash on arrival"}
            </Text>
          </Section>

          <Text style={text}>
            {paymentType === "CARD"
              ? "Please check your original registration email for payment details, or log in to your account to see your registration status."
              : "Please remember to bring cash for payment on arrival."}
          </Text>

          <Text style={text}>We're looking forward to seeing you there!</Text>

          <Button href="https://gameon.baby/dashboard" style={button}>
            View Your Dashboard
          </Button>

          <Text style={footer}>
            If you have any questions, feel free to reply to this email.
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Game On Baby Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  padding: "30px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  padding: "40px 30px",
  maxWidth: "600px",
};

const logo = {
  margin: "0 auto 20px",
  display: "block",
};

const h1 = {
  color: "#6d28d9",
  fontSize: "32px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const eventDetails = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const eventTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px",
};

const eventInfo = {
  margin: "8px 0",
  fontSize: "16px",
};

const button = {
  backgroundColor: "#6d28d9",
  borderRadius: "4px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  margin: "24px 0",
};

const footer = {
  color: "#666",
  fontSize: "14px",
  margin: "12px 0",
};

export default WaitingListPromotionTemplate;
