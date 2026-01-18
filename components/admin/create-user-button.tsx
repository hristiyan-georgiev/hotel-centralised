"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, RefreshCw, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import type { Department } from "@/lib/types"

interface CreateUserButtonProps {
  departments: Department[]
}

// Generate a random temporary password
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function CreateUserButton({ departments }: CreateUserButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [tempPassword, setTempPassword] = useState(generateTempPassword())
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"staff" | "admin">("staff")
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id || "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    const email_trimmed = `${email.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("email", email_trimmed)
      .single()

    if (existingUser) {
      setError("Username already exists. Please choose a different username.")
      setIsLoading(false)
      return
    }


    // Sign up the new user with metadata
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName,
          role,
          department_id: departmentId || null,
          requires_password_change: true,
        },
      },
    })

    setIsLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      toast.error("Failed to create user", {
        description: signUpError.message
      })
    } else if (data.user) {
      setSuccess(true)
      toast.success("User created successfully", {
        description: "Make sure to share the credentials with the user"
      })
      // Don't reset form immediately so user can copy credentials
    }
  }

  const copyPassword = async () => {
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setEmail("")
    setTempPassword(generateTempPassword())
    setFullName("")
    setRole("staff")
    setDepartmentId("")
    setSuccess(false)
    setError(null)
    setCopied(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User Account</DialogTitle>
          <DialogDescription>Create a new staff or admin account</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={success}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.smith@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={success}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">Internal email addresses preferable.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tempPassword">Temporary Password</Label>
            <div className="flex gap-2">
              <Input
                id="tempPassword"
                type="text"
                value={tempPassword}
                readOnly
                className="font-mono"
              />
              <Button
                className="cursor-pointer"
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setTempPassword(generateTempPassword())}
                disabled={success}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                className="cursor-pointer"
                type="button"
                variant="outline"
                size="icon"
                onClick={copyPassword}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">User will be required to change this on first login</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)} disabled={success}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="staff">Staff</SelectItem>
                  <SelectItem className="cursor-pointer" value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={success}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="cursor-pointer">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

          {success && (
            <div className="space-y-2 bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                ✓ User account created successfully!
              </p>
              <div className="text-sm space-y-1">
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Temporary Password:</strong> <code className="font-mono bg-black/5 px-1 rounded">{tempPassword}</code></p>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Make sure to share these credentials with the user. They will be required to change the password on first login.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              className="cursor-pointer"
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false)
                if (success) {
                  setTimeout(resetForm, 300)
                }
              }}
            >
              {success ? "Close" : "Cancel"}
            </Button>
            {success ? (
              <Button className="cursor-pointer" type="button" onClick={resetForm}>
                Create Another User
              </Button>
            ) : (
              <Button className="cursor-pointer" type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
