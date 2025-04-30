import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: "Digital Tools Hub",
  description: "A collection of document processing tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} bg-[#131618]`}>
      <body className={inter.className}>
        <Navigation />
        <main className="md:pl-64 transition-all duration-300 nav-collapsed:md:pl-16">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
