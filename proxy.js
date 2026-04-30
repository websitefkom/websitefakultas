import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// New `proxy` file to replace deprecated middleware convention.
// Mirrors the previous `middleware` behavior: protect `/dashboard` routes.
export async function proxy(req) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/dashboard')) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('returnTo', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard'],
}
