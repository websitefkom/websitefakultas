"use client"
import { useEffect } from 'react'

export default function VisitTracker() {
  useEffect(() => {
    // Gunakan sessionStorage: 1 tab/sesi = 1 kunjungan
    if (typeof window === 'undefined') return
    const key = 'visit_tracked'
    if (sessionStorage.getItem(key)) return

    fetch('/api/metrics/visit', { method: 'POST' })
      .then(() => sessionStorage.setItem(key, '1'))
      .catch(() => {}) // silent fail
  }, [])

  return null
}