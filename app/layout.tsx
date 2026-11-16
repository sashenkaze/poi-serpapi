import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cari Kafe Terdekat - SerpApi",
  description: "Cari kafe dan restoran terdekat dengan SerpApi Google Maps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}