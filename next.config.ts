import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En desarrollo, deja entrar a celulares de la misma red Wi-Fi (direcciones privadas).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  // Sin el botón "N" de Next.js en la esquina (solo salía mientras se programa). Los errores se siguen mostrando.
  devIndicators: false
};

export default nextConfig;
