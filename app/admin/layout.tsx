import type { Metadata, Viewport } from "next";
import AdminShell from "./components/AdminShell";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Tabsy - Admin Dashboard",
  description: "System administration for Tabsy Platform",
};

export const viewport: Viewport = {
  themeColor: "#0f172a", // slate-900
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 flex min-h-screen">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
