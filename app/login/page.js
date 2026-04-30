"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MdEmail, MdLock } from "react-icons/md";
import { FiFileText, FiUsers, FiActivity, FiRadio } from "react-icons/fi";
import { signIn } from "next-auth/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const rightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut", delay: 0.2 },
  },
};

const accessItems = [
  {
    icon: <FiFileText size={14} />,
    title: "Berita & Artikel",
    desc: "Publikasi dan kelola konten",
  },
  {
    icon: <FiUsers size={14} />,
    title: "Program Studi",
    desc: "Data prodi dan akreditasi",
  },
  {
    icon: <FiActivity size={14} />,
    title: "Statistik",
    desc: "Pantau trafik pengunjung",
  },
  {
    icon: <FiRadio size={14} />,
    title: "Mitra & Media",
    desc: "Kelola logo dan galeri",
  },
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (!res || res.error) {
        setError("Email atau password salah!");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Sign in error", err);
      setError("Email atau password salah!");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center overflow-hidden">
      <div className="w-full h-screen flex flex-col lg:flex-row">
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full lg:w-[38%] flex items-center justify-center border-r border-gray-100 bg-white"
          style={{ padding: "55px 44px" }}
        >
          
          <div className="w-full max-w-sm flex flex-col">
              {/* Logo */}
            <motion.div variants={itemVariants} className="flex justify-start mb-[34px]">
              <Image
                src="/logo/logopanjang.png"
                alt="Logo Fakultas Komputer Ma'soem"
                width={180}
                height={45}
                className="object-contain"
              />
            </motion.div>

            {/* Title */}
            <motion.div variants={itemVariants} className="mb-[34px]">
              <h1 className="text-[42px] font-bold text-[#0b1b4d] leading-[1.15] mb-2">
                Masuk ke
                <br />
                Dashboard
              </h1>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Khusus Admin &amp; Editor —<br />
                Fakultas Komputer Ma&#39;soem
              </p>
            </motion.div>

            {/* Fields */}
            <motion.form variants={itemVariants} onSubmit={handleSubmit}>
              <div className="flex flex-col gap-[13px] mb-[21px]">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-[11px] font-medium text-gray-500 tracking-wide"
                  >
                    Alamat Email
                  </label>
                  <div className="relative">
                    <MdEmail
                      size={16}
                      className="absolute left-[13px] top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="nama@masoemuniversity.ac.id"
                      className="w-full pl-[42px] pr-[13px] py-[13px] text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0b1b4d] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-medium text-gray-500 tracking-wide"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <MdLock
                      size={16}
                      className="absolute left-[13px] top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full pl-[42px] pr-[13px] py-[13px] text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0b1b4d] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 mb-[13px] rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] font-medium text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between mb-[21px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#0b1b4d]"
                  />
                  <span className="text-[12px] text-gray-500">Ingat saya</span>
                </label>
                <a
                  href="#"
                  className="text-[12px] text-[#0b1b4d] font-medium hover:underline"
                >
                  Lupa password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-[14px] rounded-lg font-medium text-[14px] mb-[21px] transition-all ${
                  isLoading
                    ? "bg-[#0b1b4d]/50 text-yellow-200 cursor-not-allowed"
                    : "bg-[#0b1b4d] text-yellow-400 hover:bg-[#0f2460]"
                }`}
              >
                {isLoading ? "Memverifikasi..." : "Masuk ke Dashboard"}
              </button>
            </motion.form>

            <hr className="border-gray-100 mb-[21px]" />
            <p className="text-center text-[12px] text-gray-400">
              Bukan staf?{" "}
              <a
                href="/"
                className="text-[#0b1b4d] font-medium hover:underline"
              >
                Kembali ke halaman utama
              </a>
            </p>
          </div>
        </motion.div>

        {/* ── RIGHT: Branding panel ── */}
        <motion.div
          variants={rightVariants}
          initial="hidden"
          animate="visible"
          className="hidden lg:flex w-[62%] relative overflow-hidden flex-col justify-between bg-[#0b1b4d]"
          style={{ padding: "55px 55px 34px" }}
        >
          {/* Background circles */}
          <div className="absolute top-[-120px] right-[-120px] w-[360px] h-[360px] rounded-full bg-yellow-400/[0.06]" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] rounded-full bg-white/[0.03]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.015]" />

          {/* Top: headline */}
          <div className="relative z-10">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-yellow-400/45 mb-[13px]">
              Content Management System
            </p>
            <h2 className="text-[38px] font-bold text-white leading-[1.2] m-0">
              Satu dashboard
              <br />
              untuk semua
              <br />
              <span className="text-yellow-400">kebutuhan konten.</span>
            </h2>
            <div className="w-[34px] h-[3px] bg-yellow-400 rounded-full mt-[21px]" />
          </div>

          {/* Middle: desc + 2x2 cards */}
          <div className="relative z-10">
            <p className="text-[14px] text-white/45 leading-[1.7] mb-[21px] max-w-[380px]">
              Akses terbatas untuk staf yang berwenang. Gunakan akun institusi
              untuk mengelola seluruh konten website.
            </p>
            <div className="grid grid-cols-2 gap-[13px]">
              {accessItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/[0.045] border border-white/[0.09] rounded-xl p-[21px]"
                >
                  <div className="w-[34px] h-[34px] rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-[13px] text-yellow-400">
                    {item.icon}
                  </div>
                  <p className="text-[13px] font-medium text-white/88 m-0 mb-[5px]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-white/35 leading-[1.55] m-0">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="relative z-10 text-[11px] text-white/20 border-t border-white/[0.07] pt-[13px] m-0">
            Akses terbatas — hanya untuk staf yang berwenang
          </p>
        </motion.div>
      </div>
    </div>
  );
}
