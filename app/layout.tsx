import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/primereact.css'
import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'
import './globals.css'
import '../styles/layout/layout.scss'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'StreetWise Coach - BJJ Coaching Platform',
  description: 'Professional Brazilian Jiu-Jitsu coaching and student management platform',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link id="theme-css" href={`/themes/lara-dark-green/theme.css`} rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <PrimeReactProvider>
          {children}
        </PrimeReactProvider>
      </body>
    </html>
  )
}
