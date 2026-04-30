'use client';
import { useState, useEffect } from "react";
import { Menu, User } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function Navbar({ toggleSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('users');
    if (userData) {
      setUsers(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Clear client-side storage
      localStorage.removeItem('users');
  
      // Call logout API to clear cookies
      const res = await fetch('/api/auth/logout', {
        method: 'POST'
      });
  
      if (!res.ok) {
        throw new Error('Logout failed');
      }
  
      // Force redirect to login
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force redirect even if API call fails
      router.push('/login');
    }
  };

  const displayName = () => {
    if (!users) return "Guest";
    
    switch (users.role) {
      case "mahasiswa":
        return users.name;
      case "pengurus":
        // Access UKM directly since it's an array of strings
        const ukmName = Array.isArray(users.ukm) ? users.ukm[0] : users.ukm;
        return `${users.name} (${ukmName || 'UKM'})`;
      case "admin":
        return "Administrator";
      default:
        return users.name;
    }
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

        {/* Dropdown menu */}
        <div className={`absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 z-50 ${
          dropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
        }`}>
          <div className="py-1">
            <hr className="border-gray-200 my-1" />
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