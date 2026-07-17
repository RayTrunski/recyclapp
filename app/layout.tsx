import "leaflet/dist/leaflet.css";
import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReCyClapp",
  description:
    "Plataforma para donar, reciclar y reparar articulos con flujos construidos en Next.js, Prisma y Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
