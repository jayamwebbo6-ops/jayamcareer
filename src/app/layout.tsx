import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ClientWrapper from "../components/ClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jayamwebsolutions.com'),
  title: "Career at Jayam Web Solutions",
  description: "Explore job opportunities and careers at Jayam Web Solutions.",
  alternates: {
    canonical: '/jayamcareer',
  },
  icons: {
    icon: '/logo1.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-white" suppressHydrationWarning>
        <ClientWrapper navbar={<Navbar />} footer={<Footer />}>
          {children}
        </ClientWrapper>
      </body>

    </html>
  );
}
