import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-figtree", display: "swap"});

export const metadata: Metadata = {
  title: "Match Networkeando: conecta tu idea con el superpoder de alguien"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Android: al abrir el teclado la página se achica y el campo del chat queda a la vista.
  interactiveWidget: "resizes-content",
  colorScheme: "dark",
  themeColor: "#0F0F0D"
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={figtree.variable}>
      <body data-view="inicio">{children}</body>
    </html>
  );
}
