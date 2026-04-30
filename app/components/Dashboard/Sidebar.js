"use client";
import {
  Layout,
  BookOpen,
  Award,
  Users,
  Newspaper,
  UserCircle,
  ChevronDown,
  ChevronUp,
  Link2,
  ShieldCheck,
  ListChecks,
  GraduationCap,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const menuItems = [
  {
    label: "Dashboard",
    icon: Layout,
    href: "/dashboard/",
  },
  {
    label: "Profil Fakultas",
    icon: UserCircle,
    href: "/dashboard/profil/",
  },
  {
    label: "Akademik",
    icon: BookOpen,
    submenu: [
      {
        label: "Peraturan",
        icon: ListChecks,
        href: "/dashboard/akademik/peraturan/",
      },
      {
        label: "Prodi",
        icon: GraduationCap,
        href: "/dashboard/akademik/prodi",
      },
    ],
  },
  {
    label: "Prestasi",
    icon: Award,
    href: "/dashboard/akademik/prestasi",
  },
  {
    label: "Berita",
    icon: Newspaper,
    href: "/dashboard/berita",
  },
  {
    label: "Mitra",
    icon: Handshake,
    href: "/dashboard/mitra",
  },
  {
    label: "Manajemen Pengguna",
    icon: Users,
    href: "/dashboard/manajemenpengguna",
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const [openMenus, setOpenMenus] = useState({});

  const handleToggle = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {/* Overlay for mobile/desktop when sidebar open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-label="Tutup Sidebar"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-blue-900 to-blue-800 
          text-white z-40 transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          border-r border-white/5 shadow-2xl backdrop-blur-sm`}
      >
        <div className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-white/95 px-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <div className="leading-tight">
              <div className="text-lg font-extrabold">FKOM Nexus</div>
              <div className="text-xs text-white/80">Portal Publikasi & Informasi — Fakultas Komputer Ma’soem</div>
            </div>
          </h2>
          <ul className="space-y-1.5 flex-1">
            {menuItems.map((item, idx) => (
              <li key={idx}>
                {item.submenu ? (
                  <>
                    <button
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-colors duration-200"
                      onClick={() => handleToggle(item.label)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-indigo-300" />
                        <span>{item.label}</span>
                      </div>
                      {openMenus[item.label] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {openMenus[item.label] && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((sub, subIdx) => (
                          <li key={subIdx}>
                            <Link
                              href={sub.href}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm transition-colors duration-200"
                            >
                              <sub.icon className="w-4 h-4 text-indigo-200" />
                              <span>{sub.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors duration-200"
                  >
                    <item.icon className="w-5 h-5 text-indigo-300" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="pt-4 mt-auto border-t border-white/10">
            <div className="px-4 py-3 text-xs text-white/50">
              © 2024 FKOM Nexus — Portal Publikasi & Informasi
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
