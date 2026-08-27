import { Suspense } from "react"
import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins, Source_Serif_4 } from "next/font/google"
import "./globals.css"

import { Providers } from "./providers"
import { LoadingBar } from "@/components/loading-bar"

// Poppins stays on the marketing pages; the signed-in app uses Inter for UI
// and Source Serif for headings and quoted highlights.
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" })

export const metadata: Metadata = {
  title: "Tomorrow — Book Highlights",
  description: "Manage your book highlights and receive daily inspiration",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sourceSerif.variable} ${poppins.variable}`}>
      <body className={poppins.className}>
        <Providers>
          <Suspense fallback={null}>
            <LoadingBar />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  )
}
