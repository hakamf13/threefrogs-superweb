import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://threefrogs-superweb.vercel.app"),
  title: {
    default: "Threefrogs | Reservasi Mahjong & Boardgame di Surabaya",
    template: "%s | Threefrogs",
  },
  description:
    "Reservasi mahjong dan boardgame di Surabaya. Cek store, jam operasional, ketersediaan meja, dan booking online di Threefrogs.",
  applicationName: "Threefrogs",
  keywords: [
    "Threefrogs",
    "mahjong Surabaya",
    "reservasi mahjong Surabaya",
    "boardgame Surabaya",
    "sewa meja mahjong Surabaya",
    "booking mahjong Surabaya",
    "pakuwon mall surabaya",
    "pakuwon city mall",
    "mahjong pakuwon",
    "pakuwon mahjong",
    "mahjong surabaya barat",
    "sby barat",
    "pusat surabaya",
    "tunjungan plaza",
    "mahjong tunjungan plaza",
    "mahjong tp",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Threefrogs",
    title: "Threefrogs | Reservasi Mahjong & Boardgame di Surabaya",
    description:
      "Reservasi mahjong dan boardgame di Surabaya. Cek store, jam operasional, ketersediaan meja, dan booking online di Threefrogs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}