"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmailPreferencesForm } from "@/components/email-preferences-form"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-7">
      <h2 className="font-serif text-lg text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-6">
      <span className="text-sm text-foreground">{label}</span>
      <div>{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Load user's name when component mounts
  useEffect(() => {
    const loadUserName = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single()

        if (error) throw error

        if (data?.name) {
          const [firstName = "", lastName = ""] = data.name.split(" ")
          setFormData(prev => ({
            ...prev,
            firstName,
            lastName
          }))
        }
      } catch (error) {
        console.error("Error loading user name:", error)
      }
    }

    loadUserName()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setMessage({
        type: "error",
        text: "You must be logged in to update your profile",
      })
      return
    }

    setIsUpdating(true)
    setMessage(null)

    try {
      // Combine first name and last name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      console.log("Updating name to:", fullName)
      console.log("User ID:", user.id)

      // Kiểm tra xem user đã tồn tại trong bảng public.users chưa
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking user:", checkError)
        throw checkError
      }

      let result
      if (!existingUser) {
        // Nếu chưa tồn tại, tạo mới record
        console.log("Creating new user record")
        result = await supabase
          .from("users")
          .insert({
            id: user.id,
            name: fullName,
            email: user.email
          })
          .select()
      } else {
        // Nếu đã tồn tại, update record
        console.log("Updating existing user record")
        result = await supabase
          .from("users")
          .update({ name: fullName })
          .eq("id", user.id)
          .select()
      }

      if (result.error) {
        console.error("Error updating profile:", result.error)
        throw result.error
      }

      console.log("Update response:", result.data)

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile. Please try again.",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match.",
      })
      return
    }

    setIsUpdating(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      })

      if (error) throw error

      setMessage({
        type: "success",
        text: "Password updated successfully!",
      })

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error: any) {
      console.error("Error updating password:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to update password. Please try again.",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader title="Cài đặt" description="Hồ sơ, mật khẩu và tuỳ chọn nhận email." />

      {message && (
        <Alert
          className={
            message.type === "success"
              ? "border-primary/20 bg-primary/10"
              : "border-destructive/20 bg-destructive/10"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Section title="Hồ sơ" description="Tên hiển thị trong lời chào và trong email hằng ngày.">
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <Field label="Họ">
            <Input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Nguyễn" />
          </Field>
          <Field label="Tên">
            <Input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="An" />
          </Field>
          <Field label="Email">
            <Input name="email" value={formData.email} onChange={handleChange} disabled />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Lưu hồ sơ
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Mật khẩu">
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <Field label="Mật khẩu hiện tại">
            <Input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Mật khẩu mới">
            <Input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Xác nhận">
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Email hằng ngày" description="Chọn thời điểm và tần suất nhận highlight qua email.">
        <EmailPreferencesForm />
      </Section>
    </div>
  )
}
