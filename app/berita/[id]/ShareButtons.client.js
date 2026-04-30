"use client"
import { useState } from 'react'
import { FaWhatsapp, FaLink, FaInstagram, FaTelegramPlane } from 'react-icons/fa'
import { SiTiktok, SiX } from 'react-icons/si'

export default function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${title} - ${url}`)
    if (isMobile) {
      openAppOrWeb(`whatsapp://send?text=${text}`, `https://wa.me/?text=${text}`)
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }
  }

  const shareX = () => {
    const text = encodeURIComponent(title)
    // X (formerly Twitter) intent
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  const openAppOrWeb = (appUrl, webUrl) => {
    try {
      const now = Date.now()
      // Try to open app URL first
      window.location.href = appUrl
      // Fallback to web after short delay if app not opened
      setTimeout(() => {
        if (Date.now() - now < 1200) {
          window.open(webUrl, '_blank')
        }
      }, 1000)
    } catch (e) {
      window.open(webUrl, '_blank')
    }
  }

  const shareInstagram = async () => {
    // Instagram doesn't support a standard web share for URLs. Prefer Web Share API on mobile.
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (e) {
        // fallthrough
      }
    }
    await copy()
    // On mobile try to open Instagram app, otherwise open web
    if (isMobile) {
      // best-effort deep link: try share/story composer then fallback to app home
      openAppOrWeb(
        `instagram://share?text=${encodeURIComponent(title + ' ' + url)}`,
        'https://www.instagram.com/'
      )
    } else {
      window.open('https://www.instagram.com/', '_blank')
    }
  }

  const shareTiktok = async () => {
    // TikTok has no URL composer. Use Web Share API on mobile if available, else copy+open.
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (e) {
        // fallthrough
      }
    }
    await copy()
    if (isMobile) {
      // TikTok deep links vary; attempt known scheme, fallback to web
      openAppOrWeb(
        `snssdk1128://share?text=${encodeURIComponent(title + ' ' + url)}`,
        'https://www.tiktok.com/'
      )
    } else {
      window.open('https://www.tiktok.com/', '_blank')
    }
  }

  const shareTelegram = () => {
    const text = encodeURIComponent(`${title} - ${url}`)
    if (isMobile) {
      // Try Telegram app composer first
      openAppOrWeb(`tg://msg?text=${text}`, `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`)
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank')
    }
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <button aria-label="Copy link" onClick={copy} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
        <FaLink className="text-gray-700" />
      </button>

      <button aria-label="Share to WhatsApp" onClick={shareWhatsApp} className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white">
        <FaWhatsapp />
      </button>

      <button aria-label="Share to X" onClick={shareX} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-white">
        <SiX />
      </button>

      <button aria-label="Share to Telegram" onClick={shareTelegram} className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white">
        <FaTelegramPlane />
      </button>

      <button aria-label="Share to Instagram" onClick={shareInstagram} className="w-9 h-9 flex items-center justify-center rounded-full bg-pink-500 hover:bg-pink-600 text-white">
        <FaInstagram />
      </button>

      <button aria-label="Share to TikTok" onClick={shareTiktok} className="w-9 h-9 flex items-center justify-center rounded-full bg-black hover:opacity-90 text-white">
        <SiTiktok />
      </button>

      {copied && <span className="text-sm text-gray-600 ml-2">Link disalin</span>}
    </div>
  )
}
