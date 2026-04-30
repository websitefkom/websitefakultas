'use client';
import { useState } from "react";
import { Menu, User } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar({ toggleSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const displayName = () => {
    if (!session?.user) return "Guest";
    const role = session.user.role;
    if (role === "super_admin") return `${session.user.name || 'Admin'} (Super Admin)`;
    if (role === "editor") return `${session.user.name || 'Editor'} (Editor)`;
    return session.user.name || "User";
  };

  return (
    <nav className="bg-white border-b border-gray-200 w-full h-14 flex items-center px-4 fixed top-0 z-30">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="text-blue-700 text-2xl p-2 rounded-md hover:bg-blue-50"
          aria-label="Toggle sidebar"
        >
          <Menu />
        </button>
      </div>

      <div className="fixed right-4 flex items-center">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-blue-50 relative"
        >
          <span className="text-sm text-gray-600 font-medium">{displayName()}</span>
          <User className="w-8 h-8 text-blue-700" />
        </div>

        <div className={`absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 z-50 ${
          dropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
        }`}>
          <div className="py-1">
            {session?.user && (
              <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                <div className="font-medium text-gray-700 truncate">{session.user.email}</div>
                <div className="mt-0.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${
                    session.user.role === 'super_admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {session.user.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}