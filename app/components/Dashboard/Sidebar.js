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
  ListChecks,
  GraduationCap,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Menu definition
 * roles: array of roles that can see this menu item
 *   - "super_admin" → Manajemen Pengguna, Akademik, Profil Fakultas, Berita, Prestasi, Mitra, Dashboard
 *   - "editor"      → Dashboard, Berita, Prestasi  (hanya dua konten)
 */
const ALL_MENU_ITEMS = [
  {
    label: "Dashboard",
    icon: Layout,
    href: "/dashboard/",
    roles: ["super_admin", "editor"],
  },
  {
    label: "Profil Fakultas",
    icon: UserCircle,
    href: "/dashboard/profil/",
    roles: ["super_admin"],
  },
  {
    label: "Akademik",
    icon: BookOpen,
    roles: ["super_admin"],
    submenu: [
      { label: "Peraturan", icon: ListChecks, href: "/dashboard/akademik/peraturan/" },
      { label: "Prodi", icon: GraduationCap, href: "/dashboard/akademik/prodi" },
    ],
  },
  {
    label: "Berita",
    icon: Newspaper,
    href: "/dashboard/berita",
    roles: ["super_admin", "editor"],
  },
  {
    label: "Prestasi",
    icon: Award,
    href: "/dashboard/akademik/prestasi",
    roles: ["super_admin", "editor"],
  },
  {
    label: "Mitra",
    icon: Handshake,
    href: "/dashboard/mitra",
    roles: ["super_admin"],
  },
  {
    label: "Manajemen Pengguna",
    icon: Users,
    href: "/dashboard/manajemenpengguna",
    roles: ["super_admin"],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const [openMenus, setOpenMenus] = useState({});
  const { data: session } = useSession();

  const userRole = session?.user?.role || null;

  // Filter menu berdasarkan role pengguna yang sedang login
  const menuItems = ALL_MENU_ITEMS.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  const handleToggle = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Overlay untuk mobile */}
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
          {/* Logo */}
          <h2 className="text-xl font-bold mb-3 flex items-center gap-3 text-white/95 px-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <div className="leading-tight">
              <div className="text-lg font-extrabold">FKOM Nexus</div>
              <div className="text-xs text-white/80">
                Portal Publikasi &amp; Informasi — Fakultas Komputer Ma&#39;soem
              </div>
            </div>
          </h2>

          {/* Badge role */}
          {userRole && (
            <div className="mb-4 px-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  userRole === "super_admin"
                    ? "bg-purple-500/30 text-purple-200"
                    : "bg-emerald-500/30 text-emerald-200"
                }`}
              >
                {userRole === "super_admin" ? "⚡ Super Admin" : "✏️ Editor"}
              </span>
            </div>
          )}

          {/* Keterangan akses singkat untuk Editor */}
          {userRole === "editor" && (
            <div className="mb-4 px-2 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-white/60">
              Anda hanya dapat mengelola <span className="text-white/90 font-semibold">Berita</span> dan{" "}
              <span className="text-white/90 font-semibold">Prestasi</span>.
            </div>
          )}

          {/* Menu */}
          <ul className="space-y-1.5 flex-1 overflow-y-auto">
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
              © {new Date().getFullYear()} FKOM Nexus — Portal Publikasi &amp; Informasi
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}