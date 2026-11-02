import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En desarrollo, deja entrar a celulares de la misma red Wi-Fi (direcciones privadas).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"]
};

export default nextConfig;
