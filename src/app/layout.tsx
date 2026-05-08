import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import ToastContainer from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaShare Dashboard",
  description: "Admin panel for AI-powered media sharing platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Sidebar />
          <main className="min-h-screen">
            {children}
          </main>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
