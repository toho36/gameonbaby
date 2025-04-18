import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Providers } from "./providers";
import { Navbar, SessionProvider } from "~/shared";

export const metadata: Metadata = {
  title: "GameOn Baby",
  description: "Your gaming event platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Providers>
          <SessionProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
