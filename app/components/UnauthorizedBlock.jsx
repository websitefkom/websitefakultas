"use client";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedBlock() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-50 mb-4">
        <ShieldOff className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Akses Ditolak</h2>
      <p className="text-gray-500 max-w-sm">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
    </div>
  );
}
