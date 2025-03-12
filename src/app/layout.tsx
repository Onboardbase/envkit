import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EnvKitProvider } from "@/lib/envkit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define required environment variables for your application
const requiredEnvVars = [
  {
    name: "API_KEY",
    required: true,
    description: "API key for external service"
  },
  {
    name: "DATABASE_URL",
    required: true,
    description: "Connection URL for the database"
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: true,
    description: "Public URL for the application"
  },
  {
    name: "LOG_LEVEL",
    required: false,
    defaultValue: "info",
    description: "Log level for the application (optional)"
  }
];

export const metadata: Metadata = {
  title: "EnvKit Demo",
  description: "Environment Variable Management for Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EnvKitProvider envVars={requiredEnvVars}>
          {children}
        </EnvKitProvider>
      </body>
    </html>
  );
}
