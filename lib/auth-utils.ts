import { createClient } from "./supabase/server"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return { session, user: session.user }
}

export async function getSession() {
  const supabase = await createClient()
  return await supabase.auth.getSession()
}
