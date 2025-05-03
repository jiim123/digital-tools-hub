import { Inter_Tight } from 'next/font/google'
import { Toaster } from 'sonner'
import Navigation from '@/components/Navigation'
import './globals.css'

const interTight = Inter_Tight({ 
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

export const metadata = {
  title: 'Digital Tools Hub',
  description: 'A collection of digital tools for document processing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${interTight.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hubot+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Navigation />
        <div className="main-container">
          {children}
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
