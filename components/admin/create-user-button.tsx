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
import { Plus, RefreshCw, Copy, Check, Mail, KeyRound, ShieldCheck, Building2, UserRoundPlus } from "lucide-react"
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
    setDepartmentId(departments[0]?.id || "")
    setSuccess(false)
    setError(null)
    setCopied(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground">
              <UserRoundPlus className="h-3.5 w-3.5" />
              Staff Onboarding
            </div>
            <DialogTitle className="text-xl tracking-tight">Create User Account</DialogTitle>
            <DialogDescription className="max-w-2xl text-sm">
              Add a new team member, assign permissions, and issue a temporary password for first-time access.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
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
              <Label htmlFor="email" className="inline-flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Work Email
              </Label>
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
              <p className="text-xs text-muted-foreground">Use an internal address where possible.</p>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="tempPassword" className="inline-flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Temporary Password
              </Label>
              <p className="text-xs text-muted-foreground">Required to be changed on first login</p>
            </div>

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
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="role" className="inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Role
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)} disabled={success}>
                <SelectTrigger className="w-full cursor-pointer bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="staff">Staff</SelectItem>
                  <SelectItem className="cursor-pointer" value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department" className="inline-flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Department
              </Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={success}>
                <SelectTrigger className="w-full cursor-pointer bg-background">
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
          </section>

          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          {success && (
            <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">User account created successfully.</p>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Email:</strong> {email}
                </p>
                <p>
                  <strong>Temporary Password:</strong>{" "}
                  <code className="rounded bg-black/5 px-1 font-mono">{tempPassword}</code>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Share these credentials securely with the team member. They will be prompted to change the password at first sign-in.
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
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
                {isLoading ? "Creating Account..." : "Create User"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
