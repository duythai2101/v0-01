"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { EmailPreferencesForm } from "@/components/email-preferences-form"
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-2">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {message && (
        <Alert
          className={`border ${
            message.type === "success"
              ? "border-green-500/20 bg-green-500/10"
              : "border-destructive/20 bg-destructive/10"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Email Preferences Section */}
        <EmailPreferencesForm />

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    First Name
                  </label>
                  <Input name="firstName" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Last Name
                  </label>
                  <Input name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <Input name="email" value={formData.email} onChange={handleChange} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Save Changes</Button>
            </CardFooter>
          </form>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordUpdate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Current Password
                </label>
                <Input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  New Password
                </label>
                <Input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
              </div>

              {message && (
                <Alert
                  className={`border ${
                    message.type === "success"
                      ? "border-green-500/20 bg-green-500/10"
                      : "border-destructive/20 bg-destructive/10"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="text-destructive">
                Delete Account
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
