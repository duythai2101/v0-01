import type { ReactNode } from "react"
import { getServerSession } from "@/lib/server-auth"
import { redirect } from "next/navigation"

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Check if user is already authenticated
  const session = await getServerSession()

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
