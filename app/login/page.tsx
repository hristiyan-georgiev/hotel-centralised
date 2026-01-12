"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { redirect } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        redirect("/login")
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("requires_password_change")
        .eq("id", user.id)
        .single()

      if (!profile) {
        redirect("/login")
      }

      // Check if user needs to change password on first login
      if (profile.requires_password_change) {
        router.push("/change-password")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-secondary/30 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center">
            <Image
              src="/logo/hobson.png"
              alt="Hobson Logo"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to access your centralised dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Email</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground text-center">Contact your manager if you need an account</p>
       
       <p className="text-xs text-muted-foreground text-center mt-6">Powered by</p>
         <Image
           src="/logo/playvenu-logo.png"
           alt="Playvenu Logo"
           width={120}
           height={40}
           className="object-contain"
         />
       
        </div>
      </div>
    </div>
  )
}
