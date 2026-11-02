"use client";
import { useEffect, useRef, useState } from "react";
import QRious from "qrious";

/* Dibuja el código QR en un canvas, con los mismos colores del original. */
export function QR({url}: {url: string}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(url ? "" : "El código no se pudo cargar.");

  useEffect(() => {
    if (!url || !ref.current) return;
    try {
      new QRious({element: ref.current, value: url, size: 640, level: "M", foreground: "#1A1033", background: "#FFFFFF", padding: 0});
      setError("");
    } catch {
      setError("El código no se pudo dibujar.");
    }
  }, [url]);

  return (
    <div className="qr" data-qr>
      {error
        ? <div className="qr-vacio">{error}</div>
        : <canvas ref={ref} role="img" aria-label="Código QR que abre la página para crear tu perfil"/>}
    </div>
  );
}
