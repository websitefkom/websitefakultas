'use client'
import { useEffect, useState } from "react";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function StrukturOrganisasi() {
    const [anggota, setAnggota] = useState([]);

    useEffect(() => {
        fetch("/api/strukturorganisasi")
            .then(res => res.json())
            .then(data => setAnggota(Array.isArray(data) ? data : []));
    }, []);

    // Dekan di atas, lainnya di bawah
    const dekan = anggota.find(a => a.jabatan?.toLowerCase().includes("dekan"));
    const lainnya = anggota.filter(a => !a.jabatan?.toLowerCase().includes("dekan"));

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
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <h1 className="text-4xl sm:text-4xl font-extrabold mb-4 text-white drop-shadow-lg tracking-wide">
                        Struktur Organisasi
                    </h1>
                    <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-yellow-400 to-blue-500 mx-auto mb-4 rounded-full" />
                    <p className="text-lg sm:text-xl text-white/90 font-medium drop-shadow">
                        Fakultas Komputer
                    </p>
                </div>
            </section>

            {/* Struktur Organisasi */}
            <section
                className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-100 relative"
            >
                <div className="container mx-auto px-4 max-w-5xl space-y-12">
                    {/* Dekan */}
                    {dekan && (
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-gray-300 pb-8 bg-white rounded-2xl shadow-md border mx-auto mt-10 mb-10 max-w-2xl p-6">
                            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 flex flex-col items-center">
                                <Image
                                    src={dekan.foto || "/default-avatar.png"}
                                    alt={dekan.nama}
                                    width={160}
                                    height={210}
                                    className="w-32 h-44 sm:w-40 sm:h-52 object-cover rounded-xl shadow-md border border-gray-200"
                                />
                            </div>
                            <div className="flex-1 flex flex-col items-center md:items-start">
                                <p className="text-sm sm:text-base text-blue-700 uppercase tracking-widest font-semibold mb-3 mt-2">
                                    {dekan.jabatan}
                                </p>
                                <div className="w-24 sm:w-36 h-1 bg-gradient-to-r from-yellow-400 to-blue-500 mb-4 mx-auto md:mx-0 rounded-full" />
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-3">
                                    {dekan.nama}
                                </h3>
                                {dekan.email && (
                                    <a
                                        href={`mailto:${dekan.email}`}
                                        className="text-yellow-500 hover:text-yellow-600 hover:underline block mt-2 text-base sm:text-lg break-words mb-2"
                                    >
                                        {dekan.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Anggota lainnya */}
                    {lainnya.map((item) => (
                        <div
                            key={item._id}
                            className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-gray-300 pb-8 bg-white rounded-2xl shadow-md border mx-auto mt-10 mb-10 max-w-2xl p-6"
                        >
                            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8 flex flex-col items-center">
                                <Image
                                    src={item.foto || "/default-avatar.png"}
                                    alt={item.nama}
                                    width={160}
                                    height={210}
                                    className="w-32 h-44 sm:w-40 sm:h-52 object-cover rounded-xl shadow-md border border-gray-200"
                                />
                            </div>
                            <div className="flex-1 flex flex-col items-center md:items-start">
                                <p className="text-sm sm:text-base text-blue-700 uppercase tracking-widest font-semibold mb-3 mt-2">
                                    {item.jabatan}
                                </p>
                                <div className="w-24 sm:w-36 h-1 bg-gradient-to-r from-yellow-400 to-blue-500 mb-4 mx-auto md:mx-0 rounded-full" />
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-3">
                                    {item.nama}
                                </h3>
                                {item.email && (
                                    <a
                                        href={`mailto:${item.email}`}
                                        className="text-yellow-500 hover:text-yellow-600 hover:underline block mt-2 text-base sm:text-lg break-words mb-2"
                                    >
                                        {item.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <Footer />
        </>
    );
}
