"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * useRoleGuard
 * -----------
 * Hook untuk proteksi halaman di sisi klien (client-side guard).
 * Dipakai sebagai lapis kedua setelah middleware server-side.
 *
 * @param {string | string[]} allowedRoles  - role yang diizinkan masuk
 * @param {string} redirectTo               - redirect jika tidak punya akses (default: '/dashboard/berita')
 *
 * @returns {{ session, status, hasAccess }}
 *
 * Penggunaan:
 *   const { session, status, hasAccess } = useRoleGuard('super_admin')
 *   if (!hasAccess) return null  // atau loading UI
 */
export function useRoleGuard(allowedRoles, redirectTo = '/dashboard') {
  const { data: session, status } = useSession()
  const router = useRouter()

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const userRole = session?.user?.role

  // Tetap "loading" jika session belum siap ATAU sudah authenticated tapi role belum ada
  const isLoading = status === 'loading' || (status === 'authenticated' && !userRole)
  const hasAccess = !isLoading && roles.includes(userRole)

  useEffect(() => {
    if (isLoading) return
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    // Hanya redirect jika role sudah pasti tersedia dan memang tidak diizinkan
    if (status === 'authenticated' && userRole && !roles.includes(userRole)) {
      router.replace(redirectTo)
    }
  }, [isLoading, status, userRole]) // eslint-disable-line react-hooks/exhaustive-deps

  return { session, status, hasAccess, isLoading }
}