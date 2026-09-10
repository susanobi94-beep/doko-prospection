import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

// §7 Typographie : Sora pour titres/nav (poids 600/700/800), display "swap".
// Le corps/tableaux utilisent la pile système déclarée en CSS (globals.css --font-sans).
const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Doko Prospection",
  description: "Suivi de la prospection boutiques pour Doko",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
