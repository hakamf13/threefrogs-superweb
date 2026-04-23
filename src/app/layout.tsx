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
    "reservasi mahjong Surabaya",
    "mahjong Surabaya",
    "boardgame Surabaya",
    "booking mahjong Surabaya",
    "sewa meja mahjong Surabaya",
    "mahjong Surabaya Barat",
    "mahjong Pakuwon",
    "mahjong Pakuwon City Mall",
    "mahjong Tunjungan Plaza",
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
  twitter: {
    card: "summary",
    title: "Threefrogs | Reservasi Mahjong & Boardgame di Surabaya",
    description:
      "Reservasi mahjong dan boardgame di Surabaya. Cek store, jam operasional, ketersediaan meja, dan booking online di Threefrogs.",
  },

  // Nanti aktifkan ini setelah kamu dapat token verifikasi dari Google Search Console
  // verification: {
  //   google: "googledfec0b10d7d26bfa.html",
  // },
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