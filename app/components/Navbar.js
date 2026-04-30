"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from 'next/link';

const menu = [
  { name: "Beranda", href: "/" },
  {
    name: "Profil",
    submenu: [
      { name: "Tentang Kami", href: "/profil" },
      { name: "Struktur Organisasi", href: "/strukturorganisasi" },
      { name: "Prestasi", href: "/prestasi" },
      { name: "Tautan", href: "/tautan" },
    ],
  },
  {
    name: "Akademik",
    submenu: [
      { name: "Program Studi", href: "/prodi" },
      { name: "Peraturan Akademik", href: "/peraturan" },
    ],
  },
  { name: "Berita", href: "/berita" },
  { name: "Kontak Kami", href: "/kontak" },
];


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  let dropdownTimeout = null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleMouseEnter = (idx) => {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
    setDropdown(idx);
  };

  const handleMouseLeave = () => {
    dropdownTimeout = setTimeout(() => setDropdown(null), 150);
  };

  return (
    <nav className={`fixed top-0 z-[99] w-full transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}>
      {/* Main Nav Content */}
      <div className="relative max-w-full mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center h-12 relative z-20 ml-10 md:ml-8 lg:ml-24">
          <Image
            src="/logo/logopanjang.png"
            alt="Logo Fakultas Komputer Ma&#39soem University"
            height={35}
            width={140}
            className="h-7 md:h-8 lg:h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-3 lg:gap-6 mr-20">
          {menu.map((item, idx) => (
            <li
              key={item.name}
              className="relative group"
              onMouseEnter={() => handleMouseEnter(idx)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={item.href || "/"}
                className={`px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-200
                  ${isScrolled ? 'text-gray-900 hover:text-blue-600' : 'text-gray-900 hover:text-yellow-400'}`}
              >
                <span className="flex items-center gap-1.5">
                  {item.name}
                  {item.submenu && (
                    <svg className={`w-4 h-4 transition-transform duration-200 ${dropdown === idx ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              </Link>

              {/* Desktop Dropdown */}
              {item.submenu && dropdown === idx && (
                <ul className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 animate-fadeIn">
                  {item.submenu.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.href}
                        className="block px-6 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden relative z-[101] p-2 rounded-lg transition-colors ${isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-black hover:bg-white/10'
            }`}
          aria-label="Menu"
        >
          <div className="w-6 h-6 flex items-center justify-center relative">
            <span className={`hamburger-line top ${open ? 'active' : ''}`}></span>
            <span className={`hamburger-line middle ${open ? 'active' : ''}`}></span>
            <span className={`hamburger-line bottom ${open ? 'active' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed top-0 left-0 w-full h-full z-[100] bg-white ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`}
        style={{ position: 'fixed', height: '100vh' }}
      >
        <div className="relative h-full w-full px-4 pt-20 pb-6 overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-4 p-2 text-gray-500 hover:text-gray-700 z-[101]"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Menu Items */}
          <ul className="space-y-4">
            {menu.map((item, idx) => (
              <li key={item.name} className="relative">
                {item.submenu ? (
                  <button
                    onClick={() => {
                      setMobileDropdown(mobileDropdown === idx ? null : idx);
                    }}
                    className="w-full text-left px-4 py-3.5 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                  >
                    {item.name}
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${mobileDropdown === idx ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="block w-full px-4 py-3.5 rounded-lg text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}

                {/* Mobile Dropdown */}
                {item.submenu && mobileDropdown === idx && (
                  <ul className="mt-2 space-y-2 bg-gray-50 rounded-lg p-2">
                    {item.submenu.map((sub) => (
                      <li key={sub.name}>
                        <Link
                          href={sub.href}
                          className="block px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
                          onClick={() => setOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}