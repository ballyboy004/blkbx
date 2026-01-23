import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geist = Geist({ subsets: ["latin"] })
const _ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-ibm-plex-mono",
})

export const metadata: Metadata = {
  title: "BLACKBOX",
  description: "Career infrastructure for artists who move different",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={ibmPlexMono.variable}>
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
