"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { User, KeyRound, Mail, Briefcase, Building2 } from "lucide-react"
import type { Profile } from "@/lib/types"

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = "/login"
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, department:departments(*)")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)
      }
      setLoading(false)
    }

    loadProfile()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    if (!currentPassword) {
      setError("Current password is required")
      setIsUpdating(false)
      return
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      setIsUpdating(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      setIsUpdating(false)
      return
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password")
      setIsUpdating(false)
      return
    }

    const supabase = createClient()

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || "",
        password: currentPassword,
      })

      if (signInError) {
        setError("Current password is incorrect")
        setIsUpdating(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <User className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <p className="text-lg font-medium">{profile.full_name}</p>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <p className="text-lg font-medium">{profile.email}</p>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              Role
            </Label>
            <p className="text-lg font-medium capitalize">{profile.role}</p>
          </div>

          {profile.department && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Department
              </Label>
              <p className="text-lg font-medium">{profile.department.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                {success}
              </div>
            )}

            <Button type="submit" className="cursor-pointer" disabled={isUpdating}>
              {isUpdating ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
