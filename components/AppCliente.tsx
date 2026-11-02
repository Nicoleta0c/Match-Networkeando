"use client";
import dynamic from "next/dynamic";

/* La app depende del #hash, de localStorage y del tamaño de la pantalla,
   así que solo se dibuja en el navegador (igual que el index.html original). */
const App = dynamic(() => import("./App"), {ssr: false});

export default function AppCliente() {
  return <App/>;
}
