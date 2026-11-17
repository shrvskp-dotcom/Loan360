import type { Metadata } from "next";
import { getLang } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lån360",
  description: "Digital indsamling af dokumenter til boliglåneansøgninger",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
