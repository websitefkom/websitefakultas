import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Peta hak akses per route prefix:
 *   - super_admin : semua halaman dashboard
 *   - editor      : /dashboard, /dashboard/berita, /dashboard/akademik/prestasi
 *
 * Aturan: jika route ada di EDITOR_ALLOWED, editor boleh masuk.
 * Selain itu hanya super_admin yang boleh.
 */
const EDITOR_ALLOWED = [
  '/dashboard',
  '/dashboard/berita',
  '/dashboard/akademik/prestasi',
]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const role = token?.role

    // Jika belum login, withAuth sudah redirect ke /login otomatis
    if (!role) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Super admin bebas akses semua
    if (role === 'super_admin') {
      return NextResponse.next()
    }

    // Editor: cek apakah path yang dituju termasuk yang diizinkan
    if (role === 'editor') {
      const allowed = EDITOR_ALLOWED.some((prefix) => pathname.startsWith(prefix))
      if (!allowed) {
        // Redirect ke dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Jalankan middleware hanya jika ada token (sudah login)
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  // Terapkan middleware ke seluruh halaman dashboard & API yang butuh auth
  matcher: [
    '/dashboard/:path*',
  ],
}