import { updateSession } from "@/lib/supabase/proxy"
import { NextResponse } from 'next/server'
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host')

  // Define your allowed domains (including localhost for development)
  const allowedDomains = [
    'hobson.bohflow.com',
    'www.hobson.bohflow.com',
    'localhost:3000'
  ]

  // Check if current hostname is in the allowed list
  const isAllowed = allowedDomains.some(domain => hostname === domain)

  // In production, if the domain is NOT allowed, return a 403 Forbidden
  if (process.env.NODE_ENV === 'production' && !isAllowed) {
    return new NextResponse('Unauthorized Domain Access', { status: 403 })
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
