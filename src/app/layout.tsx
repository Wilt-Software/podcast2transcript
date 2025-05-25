import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PodScript - Fast Podcast Transcription & Summarization",
  description: "Lightning-fast podcast transcription and summarization. Get 1-hour audio transcribed in minutes. Pay-as-you-go. No subscription required.",
  keywords: ["podcast", "transcription", "summarization", "audio", "AI", "speech-to-text"],
  authors: [{ name: "PodScript" }],
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
