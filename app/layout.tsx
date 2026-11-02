import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope", display: "swap"});
// Títulos: una grotesca con carácter, más estrecha y expresiva que el texto corrido.
const bricolage = Bricolage_Grotesque({subsets: ["latin"], axes: ["opsz", "wdth"], variable: "--font-bricolage", display: "swap"});

export const metadata: Metadata = {
  title: "Match Networkeando: conecta tu idea con el superpoder de alguien"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#0D0C1D"
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={manrope.variable + " " + bricolage.variable}>
      <body data-view="inicio">{children}</body>
    </html>
  );
}
