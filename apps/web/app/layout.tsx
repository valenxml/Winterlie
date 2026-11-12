import type { Metadata } from "next";
import "./globals.css";
import { googleFontsUrl } from "@/lib/typography";

export const metadata: Metadata = {
  title: "Winterlie",
  description: "Make ideas worth building.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={googleFontsUrl()} />
      </head>
      <body>{children}</body>
    </html>
  );
}
