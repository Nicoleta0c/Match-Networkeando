declare module "qrious" {
  type Opciones = {
    element?: HTMLCanvasElement | HTMLImageElement;
    value?: string;
    size?: number;
    level?: "L" | "M" | "Q" | "H";
    foreground?: string;
    background?: string;
    padding?: number | null;
  };
  export default class QRious {
    constructor(opciones?: Opciones);
  }
}
