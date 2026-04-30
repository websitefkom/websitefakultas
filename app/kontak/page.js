"use client";
import { FiMail, FiPhone, FiMapPin, FiUser } from "react-icons/fi";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Image from "next/image";

export default function Kontak() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        <Image
          src="/background/gedung2.jpg"
          alt="Campus Background"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-[#0b1b4d]/60" />
        <div className="relative z-10 text-center w-full px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Kontak Kami
          </h1>
          <div className="w-24 h-1 bg-yellow-400 mx-auto mb-4" />
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div
            className="rounded-2xl overflow-hidden shadow-lg border border-blue-100"
            style={{ height: "500px" }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.7491857846363!2d107.75635089999999!3d-6.947997900000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68c3615968483b%3A0xabdf2ae214134ef7!2sMa'soem%20University!5e0!3m2!1sen!2sid!4v1234567890"
              title="Ma'soem University Location"
              aria-label="Ma'soem University - Jl. Raya Cipacing No.22, Jatinangor, Sumedang, Jawa Barat"
              loading="lazy"
              allowFullScreen=""
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              style={{ border: 0 }}
            />
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Narahubung */}
          <div className="bg-blue-50 rounded-xl shadow-md p-8 flex flex-col items-center border border-blue-100">
            <div className="mb-4">
              <FiPhone className="w-10 h-10 text-blue-600" />
            </div>
            <h4 className="text-xl font-bold text-blue-700 mb-2">Narahubung</h4>
            <p className="text-gray-700 text-center mb-2">
              Phone: +62-22-7798340 <br /> Fax: +62-22-720299
            </p>
            <a
              href="mailto:fkom@masoemuniversity.com"
              target="_blank"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-2"
            >
              fkom@masoemuniversity.com
            </a>
          </div>
          {/* Alamat */}
          <div className="bg-blue-50 rounded-xl shadow-md p-8 flex flex-col items-center border border-blue-100">
            <div className="mb-4">
              <FiMapPin className="w-10 h-10 text-blue-600" />
            </div>
            <h4 className="text-xl font-bold text-blue-700 mb-2">Alamat</h4>
            <p className="text-gray-700 text-center mb-2">
              Jl. Raya Cipacing No. 22, Jatinangor, Sumedang, <br /> Jawa Barat
              45363
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
