import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./critical.css";

// Google-hosted font avoids broken layouts when local Geist files are missing from the repo.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CreatorDash", template: "%s · CreatorDash" },
  description: "TikTok content command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
