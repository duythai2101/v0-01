import type React from "react"
import { MainLayout as MainLayoutComponent } from "@/components/main-layout"
import { getServerSession } from "@/lib/server-auth"
import { redirect } from "next/navigation"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  return <MainLayoutComponent>{children}</MainLayoutComponent>
}
