import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalStatusBanner from "@/components/GlobalStatusBanner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NIS | AI-Powered Security Intelligence Platform",
  description: "National Intelligence Service - AI-Powered National Security and Smart Policing Intelligence Platform for Kenya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Service Worker Registration */}
        <ServiceWorkerRegistration />

        {/* Global Status Banner */}
        <GlobalStatusBanner />

        {/* Main App with Error Boundary */}
        <ErrorBoundary componentName="NCTIRS Dashboard">
          {children}
        </ErrorBoundary>

        {/* Kenya Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-green-900/50 py-2 px-4 z-40">
          <div className="flex justify-between items-center text-[9px] font-mono text-green-800">
            <span>🇰🇪 REPUBLIC OF KENYA | NATIONAL CYBER COMMAND</span>
            <span>NCTIRS v1.3.0 | NIST SP 800-53 COMPLIANT</span>
            <span>Built with ❤️ for NIRU Hackathon 2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

