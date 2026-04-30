"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BackToTop({ offset = 300 }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > offset);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);

  const scrollToTop = () => typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!visible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={scrollToTop}
      aria-label="Kembali ke Atas"
      className="fixed right-6 bottom-6 z-50 w-12 h-12 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-lg hover:scale-105"
    >
      ↑
    </motion.button>
  );
}
