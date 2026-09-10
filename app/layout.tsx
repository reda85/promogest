import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromoGest — CRM Immobilier Maroc",
  description: "CRM pour promoteurs immobiliers au Maroc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
