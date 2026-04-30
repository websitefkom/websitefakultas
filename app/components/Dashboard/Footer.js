export default function Footer({ className = '' }) {
  return (
    <footer className={`w-full text-center text-sm text-gray-500 py-4 border-t border-gray-100 bg-white/50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">&copy; {new Date().getFullYear()} Ma&#39;soem University. Sistem Informasi UKM Mahasiswa.</div>
    </footer>
  )
}