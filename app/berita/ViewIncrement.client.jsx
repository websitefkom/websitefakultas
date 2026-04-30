"use client"
import { useEffect } from 'react'

/**
 * ViewIncrement — increment views berita sekali per sesi.
 *
 * Menggunakan sessionStorage (bukan localStorage) agar:
 * - Setiap kali user membuka tab/browser baru → terhitung 1 view baru
 * - Kalau reload dalam tab yang sama → tidak double count
 * - Konsisten dengan strategi VisitTracker di layout.js
 */
export default function ViewIncrement({ id }) {
  useEffect(() => {
    if (!id || typeof window === 'undefined') return
    try {
      const key = `viewed_${id}`
      if (sessionStorage.getItem(key)) return

      // Tandai dulu sebelum fetch, hindari race condition jika komponen re-render
      sessionStorage.setItem(key, '1')

      fetch(`/api/berita/${id}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        keepalive: true,
      }).catch(() => {}) // silent fail, jangan ganggu UX pembaca
    } catch (e) {
      // ignore — sessionStorage mungkin diblokir (mode privat tertentu)
    }
  }, [id])

  return null
}