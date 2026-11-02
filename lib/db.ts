import { PrismaClient, type Perfil as FilaPerfil } from "@prisma/client";

/* Una sola conexión, aunque Next recargue el código en desarrollo. */
const global = globalThis as unknown as {prisma?: PrismaClient};
export const db = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = db;

/* Convierte una fila de la base de datos al formato que espera limpiar() en el navegador. */
export function aDocumento(f: FilaPerfil) {
  const lista = (t: string) => { try { const v = JSON.parse(t); return Array.isArray(v) ? v : []; } catch { return []; } };
  return {
    id: f.id, idea: f.idea, needs: lista(f.needs), power: f.power,
    anon: f.anon, alias: f.alias, que: f.que, contact: f.contact,
    likes: lista(f.likes), color: f.color, createdAt: f.createdAt
  };
}
