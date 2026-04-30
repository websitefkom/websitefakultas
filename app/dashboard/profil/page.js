"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, Info } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Image from "next/image";

import Sidebar from "@/app/components/Dashboard/Sidebar";
import Navbar from "@/app/components/Dashboard/Navbar";
import Footer from "@/app/components/Dashboard/Footer";

const MySwal = withReactContent(Swal);

export default function AdminProfil() {
  const [tab, setTab] = useState("tentang");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [tentangKami, setTentangKami] = useState({ visi: "", misi: [], tujuan: [] });
  const [strukturOrganisasi, setStrukturOrganisasi] = useState([]);
  const [tautan, setTautan] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "edit-tentang", "add-anggota", "edit-anggota"
  const [currentEditIndex, setCurrentEditIndex] = useState(null);

  const [formTentang, setFormTentang] = useState({ visi: "", misi: [], tujuan: [] });
  const [formAnggota, setFormAnggota] = useState({ nama: "", jabatan: "", email: "", foto: "" });
  const [isSavingAnggota, setIsSavingAnggota] = useState(false);
  const [isTautanModalOpen, setIsTautanModalOpen] = useState(false);
  const [formTautan, setFormTautan] = useState({ title: "", desc: "", url: "" });
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    fetch("/api/profil")
      .then(res => res.json())
      .then(data => { if (data) setTentangKami(data); });

    fetch("/api/strukturorganisasi")
      .then(res => res.json())
      .then(data => setStrukturOrganisasi(Array.isArray(data) ? data : []))
      .catch(() => setStrukturOrganisasi([]));

    fetch("/api/tautan")
      .then(res => res.json())
      .then(data => setTautan(Array.isArray(data.data) ? data.data : []));
  }, []);

  // Modal functions
  const openModal = (type, index = null) => {
    setModalType(type);
    setCurrentEditIndex(index);

    if (type === "edit-tentang") setFormTentang({ ...tentangKami });
    if (type === "edit-anggota" && index !== null) setFormAnggota({ ...strukturOrganisasi[index] });
    if (type === "add-anggota") setFormAnggota({ nama: "", jabatan: "", email: "", foto: "" });

    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const openTautanModal = (index = null) => {
    if (index !== null) {
      setFormTautan({ ...tautan[index] });
      setEditIndex(index);
    } else {
      setFormTautan({ title: "", desc: "", url: "" });
      setEditIndex(null);
    }
    setIsTautanModalOpen(true);
  };
  const closeTautanModal = () => {
    setIsTautanModalOpen(false);
    setFormTautan({ title: "", desc: "", url: "" });
    setEditIndex(null);
  };

  // Submit Tentang Kami
  const onSubmitTentang = async () => {
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formTentang),
      });
      if (res.ok) {
        setTentangKami(formTentang);
        closeModal();
        MySwal.fire("Berhasil", "Data Tentang Kami diperbarui", "success");
      }
    } catch (err) {
      console.error(err);
      MySwal.fire("Gagal", "Terjadi kesalahan saat update", "error");
    }
  };

  // Submit anggota
  const onSubmitAnggota = async () => {
    try {
      setIsSavingAnggota(true);
      const updated = [...strukturOrganisasi];
      const formData = new FormData();
      if (modalType === "add-anggota") {
        formData.append("nama", formAnggota.nama);
        formData.append("jabatan", formAnggota.jabatan);
        formData.append("email", formAnggota.email || "");
        if (formAnggota.fotoFile) formData.append("foto", formAnggota.fotoFile);

        const res = await fetch("/api/strukturorganisasi", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Gagal menambahkan anggota");
        const data = await res.json();
        updated.push(data);
        setStrukturOrganisasi(updated);
        MySwal.fire("Berhasil", "Anggota ditambahkan", "success");
      } else if (modalType === "edit-anggota" && currentEditIndex !== null) {
        const anggotaId = strukturOrganisasi[currentEditIndex]._id;
        formData.append("nama", formAnggota.nama);
        formData.append("jabatan", formAnggota.jabatan);
        formData.append("email", formAnggota.email || "");
        if (formAnggota.fotoFile) formData.append("foto", formAnggota.fotoFile);

        const res = await fetch(`/api/strukturorganisasi/${anggotaId}`, { method: "PUT", body: formData });
        if (!res.ok) throw new Error("Gagal memperbarui anggota");
        const data = await res.json();
        updated[currentEditIndex] = data;
        setStrukturOrganisasi(updated);
        MySwal.fire("Berhasil", "Data anggota diperbarui", "success");
      }
      closeModal();
      setIsSavingAnggota(false);
    } catch (err) {
      console.error(err);
      setIsSavingAnggota(false);
      MySwal.fire("Gagal", err.message, "error");
    }
  };

  // Resize image client-side to reduce upload size and speed up uploads
  const resizeImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const resizedFile = new File([blob], file.name, { type: file.type });
              resolve(resizedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = (e) => reject(new Error("Failed to load image for resizing"));
        img.src = URL.createObjectURL(file);
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleHapusAnggota = async (nama, index) => {
    const anggotaId = strukturOrganisasi[index]._id;
    MySwal.fire({
      title: `Hapus ${nama}?`,
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetch(`/api/strukturorganisasi/${anggotaId}`, { method: "DELETE" });
        const updated = [...strukturOrganisasi];
        updated.splice(index, 1);
        setStrukturOrganisasi(updated);
        MySwal.fire("Terhapus!", `${nama} berhasil dihapus.`, "success");
      }
    });
  };

  // Tautan CRUD
  const handleTautanSubmit = async () => {
    if (!formTautan.title || !formTautan.url) {
      MySwal.fire("Peringatan", "Judul dan URL wajib diisi!", "warning");
      return;
    }
    try {
      let updated = [...tautan];
      if (editIndex !== null) {
        const res = await fetch(`/api/tautan?id=${tautan[editIndex]._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formTautan),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Gagal memperbarui tautan");
        updated[editIndex] = { ...data.data, _id: data.data._id.toString() };
        setTautan(updated);
        MySwal.fire("Berhasil", "Tautan berhasil diperbarui", "success");
      } else {
        const res = await fetch("/api/tautan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formTautan),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Gagal menambahkan tautan");
        updated.push({ ...data.data, _id: data.data._id.toString() });
        setTautan(updated);
        MySwal.fire("Berhasil", "Tautan berhasil ditambahkan", "success");
      }
      closeTautanModal();
    } catch (err) {
      console.error(err);
      MySwal.fire("Gagal", err.message, "error");
    }
  };

  const handleDeleteTautan = async (index) => {
    const tautanItem = tautan[index];
    if (!tautanItem?._id) return;
    MySwal.fire({
      title: `Hapus tautan "${tautanItem.title}"?`,
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await fetch(`/api/tautan?id=${tautanItem._id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Gagal menghapus tautan");
        const updated = [...tautan];
        updated.splice(index, 1);
        setTautan(updated);
        MySwal.fire("Terhapus!", "Tautan berhasil dihapus.", "success");
      }
    });
  };

  const tabs = [
    { key: "tentang", label: "Tentang Kami" },
    { key: "struktur", label: "Struktur Organisasi" },
    { key: "tautan", label: "Tautan" },
  ];

  return (
    <div className="flex flex-col md:flex-row bg-blue-50 min-h-screen w-full font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="admin" />
      <div className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? "md:ml-64" : ""} flex flex-col`}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userData={{ role: "admin", nama: "Admin" }} />

        <main className="w-full max-w-7xl mx-auto px-4 pt-20 pb-24 flex-1">
          {/* Page header (aligned with peraturan page) */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 flex items-center gap-3"><Info className="w-6 h-6 text-[#2563eb]"/>Manajemen Profil Fakultas</h1>
                <p className="text-sm text-[#6b7280] mt-1">Atur Visi, Misi, Struktur Organisasi, dan tautan penting fakultas</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-8 overflow-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-all ${tab === t.key ? 'text-[#2563eb]' : 'text-[#6b7280] hover:text-[#2563eb]'}`}
                aria-current={tab === t.key}
              >
                {t.label}
                <span className={`block h-1 mt-2 transition-all ${tab === t.key ? 'bg-[#2563eb] rounded-t-full' : 'bg-transparent'}`} />
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* Tentang Kami */}
            {tab === "tentang" && (
              <motion.div key="tentang" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                <Card className="shadow-lg border border-blue-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-b from-[#ebf5ff] to-white p-4">
                    <CardTitle className="flex justify-between items-center text-blue-900 font-semibold">
                      Visi, Misi, dan Tujuan Fakultas Komputer
                      <button onClick={() => openModal("edit-tentang")} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 border border-gray-200 text-blue-800 hover:scale-105 transition transform shadow-sm">
                        <Pencil className="w-4 h-4" /> <span className="text-sm">Edit Data</span>
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 p-6">
                    <section>
                      <h3 className="font-semibold text-lg text-blue-900 mb-2">Visi</h3>
                      <p className="text-gray-700 leading-relaxed">{tentangKami.visi || <span className="text-gray-400">Belum ada visi — tambahkan untuk menampilkan informasi yang jelas kepada pengguna.</span>}</p>
                    </section>
                    <section>
                      <h3 className="font-semibold text-lg text-blue-900 mb-2">Misi</h3>
                      <ul className="list-disc ml-6 space-y-1 text-gray-700">{(tentangKami.misi || []).map((m, i) => (<li key={i}>{m}</li>))}</ul>
                    </section>
                    <section>
                      <h3 className="font-semibold text-lg text-blue-900 mb-2">Tujuan</h3>
                      <ul className="list-decimal ml-6 space-y-1 text-gray-700">{(tentangKami.tujuan || []).map((t, i) => (<li key={i}>{t}</li>))}</ul>
                    </section>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Struktur Organisasi */}
            {tab === "struktur" && (
              <motion.div key="struktur" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }}>
                <Card className="shadow-lg border border-blue-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-b from-[#ebf5ff] to-white p-4">
                    <CardTitle className="flex justify-between items-center text-blue-900 font-semibold">
                      Struktur Organisasi
                      <button className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white text-blue-900 shadow-md ring-1 ring-blue-100 hover:scale-105 transform transition" onClick={() => openModal("add-anggota")}>
                        <Plus className="w-4 h-4" /> <span className="text-sm">Tambah Anggota</span>
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {strukturOrganisasi.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {strukturOrganisasi.map((org, i) => (
                          <div key={i} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1">
                            {org.foto ? (
                              <Image src={org.foto} alt={org.nama} width={96} height={96} className="w-24 h-24 rounded-full object-cover border flex-shrink-0" />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border flex-shrink-0">
                                <span className="text-gray-500 text-sm">No Image</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900">{org.nama}</h4>
                              <p className="text-sm text-gray-600">{org.jabatan}</p>
                              {org.email && (
                                <a href={`mailto:${org.email}`} className="text-sm text-[#2563eb] hover:underline">{org.email}</a>
                              )}
                            </div>

                            <div className="flex gap-2 mt-4 md:mt-0">
                              <Button size="sm" variant="outline" onClick={() => openModal("edit-anggota", i)}>
                                <Pencil className="w-4 h-4" /> Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleHapusAnggota(org.nama, i)}>
                                <Trash className="w-4 h-4" /> Hapus
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        Belum ada struktur organisasi. <br />
                        <button className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white text-blue-900 shadow-md ring-1 ring-blue-100 hover:scale-105 transition" onClick={() => openModal("add-anggota")}>
                          <Plus className="w-4 h-4" /> Tambah Anggota
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Tautan */}
            {tab === "tautan" && (
              <motion.div key="tautan" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4 }}>
                <Card className="shadow-lg border border-blue-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-b from-[#ebf5ff] to-white p-4">
                    <CardTitle className="flex items-center gap-2 w-full justify-between text-blue-900 font-semibold">
                      <span>Daftar Tautan</span>
                      <button className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white text-blue-900 shadow-md ring-1 ring-blue-100 hover:scale-105 transform transition" onClick={() => openTautanModal()}>
                        <Plus className="w-4 h-4" /> Tambah Tautan
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {tautan.length === 0 && <div className="text-gray-500 py-8 text-center">Belum ada tautan.</div>}
                    <div className="space-y-6">
                      {tautan.map((t, idx) => (
                        <div key={t._id || idx} className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-4 rounded-lg border shadow-sm">
                          <div>
                            <div className="font-semibold text-blue-900">{t.title}</div>
                            <div className="text-gray-700 text-sm mb-1">{t.desc}</div>
                            <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-600 hover:underline text-sm">{t.url}</a>
                          </div>
                          <div className="flex gap-2 mt-3 md:mt-0">
                            <Button size="sm" variant="outline" onClick={() => openTautanModal(idx)}>
                              <Pencil className="w-4 h-4" /> Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteTautan(idx)}>
                              <Trash className="w-4 h-4" /> Hapus
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {/* Modal Tentang & Anggota */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.18 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b bg-white/60 sticky top-0 z-10">
                <h3 className="text-xl md:text-2xl font-semibold text-blue-900">
                  {modalType === "edit-tentang" && "Edit Tentang Kami"}
                  {modalType === "add-anggota" && "Tambah Anggota"}
                  {modalType === "edit-anggota" && "Edit Anggota"}
                </h3>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 max-h-[70vh]">
                {modalType === "edit-tentang" && (
                  <div className="space-y-4">
                    {['visi','misi','tujuan'].map((field) => (
                      <div key={field} className="space-y-2">
                        <label className="font-medium text-sm">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        {field === 'visi' ? (
                          <>
                            <textarea
                              rows={3}
                              placeholder="Tuliskan visi singkat"
                              className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] focus:outline-none resize-y"
                              value={formTentang.visi}
                              onChange={(e) => setFormTentang({ ...formTentang, visi: e.target.value })}
                            />
                            <p className="text-xs text-gray-500">Contoh: Menjadi fakultas unggul dalam pendidikan komputer berbasis riset.</p>
                          </>
                        ) : (
                          <div className="space-y-3">
                            {(formTentang[field] || []).map((item, i) => (
                              <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                                <div className="flex-shrink-0 w-6 text-gray-600 text-right text-sm mt-1">{i + 1}.</div>
                                <textarea
                                  rows={2}
                                  className="flex-1 border border-gray-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#2563eb] focus:outline-none resize-y"
                                  placeholder={`Masukkan ${field} ke-${i + 1}`}
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...formTentang[field]];
                                    updated[i] = e.target.value;
                                    setFormTentang({ ...formTentang, [field]: updated });
                                  }}
                                />
                                <button onClick={() => {
                                  const updated = [...formTentang[field]];
                                  updated.splice(i, 1);
                                  setFormTentang({ ...formTentang, [field]: updated });
                                }} className="text-red-600 p-2 rounded-md bg-red-50 hover:bg-red-100">
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            <button onClick={() => setFormTentang({ ...formTentang, [field]: [...(formTentang[field] || []), ''] })} className="w-full mt-1 py-2 text-sm rounded-md border-2 border-dashed border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100">
                              + Tambah {field.charAt(0).toUpperCase() + field.slice(1)}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(modalType === "add-anggota" || modalType === "edit-anggota") && (
                  <div className="space-y-4">
                    {["nama","jabatan","email"].map((field) => (
                      <div key={field} className="space-y-1">
                        <label className="font-medium text-sm">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input
                          type={field === 'email' ? 'email' : 'text'}
                          placeholder={field === 'email' ? 'email@domain.com (opsional)' : `Masukkan ${field}`}
                          className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#2563eb] focus:outline-none"
                          value={formAnggota[field] || ''}
                          onChange={(e) => setFormAnggota({ ...formAnggota, [field]: e.target.value })}
                        />
                        {field === 'email' && <p className="text-xs text-gray-500">Gunakan email resmi jika tersedia (opsional).</p>}
                      </div>
                    ))}

                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-2 block">Foto</label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files && e.dataTransfer.files[0];
                          if (!f) return;
                          try {
                            const resized = await resizeImage(f, 1200, 0.8);
                            setFormAnggota({ ...formAnggota, fotoFile: resized, fotoPreview: URL.createObjectURL(resized) });
                          } catch (err) {
                            setFormAnggota({ ...formAnggota, fotoFile: f, fotoPreview: URL.createObjectURL(f) });
                          }
                        }}
                        className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50"
                        onClick={() => document.getElementById('anggota-file-input')?.click()}
                      >
                        <div className="mb-2">Tarik dan lepaskan file di sini, atau klik untuk memilih</div>
                        <div className="text-xs text-gray-400">PNG, JPG, maksimal 5MB</div>
                        <input id="anggota-file-input" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          try {
                            const resized = await resizeImage(file, 1200, 0.8);
                            setFormAnggota({ ...formAnggota, fotoFile: resized, fotoPreview: URL.createObjectURL(resized) });
                          } catch (err) {
                            setFormAnggota({ ...formAnggota, fotoFile: file, fotoPreview: URL.createObjectURL(file) });
                          }
                        }} />

                        {formAnggota.fotoPreview && (
                          <div className="mt-3 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <Image src={formAnggota.fotoPreview} alt="Preview" width={800} height={400} unoptimized className="w-full h-48 object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t bg-white/60 sticky bottom-0 z-10 flex justify-end gap-3">
                <button className="py-1 px-3 text-sm rounded-lg border border-gray-300 text-gray-700 hover:scale-95" onClick={closeModal} disabled={isSavingAnggota}>Batal</button>
                {(modalType === 'edit-tentang') ? (
                  <button className="py-1 px-3 text-sm rounded-lg bg-[#2563eb] text-white hover:scale-105 transition" onClick={onSubmitTentang}>Simpan</button>
                ) : (
                  <button
                    className={`py-1 px-3 text-sm rounded-lg text-white ${isSavingAnggota ? 'bg-[#1e40af] opacity-90' : 'bg-[#2563eb] hover:scale-105'} transition flex items-center gap-2`}
                    onClick={onSubmitAnggota}
                    disabled={isSavingAnggota}
                  >
                    {isSavingAnggota ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan</span>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tautan */}
      {isTautanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            <div className="px-6 py-4 border-b sticky top-0 bg-white/60 z-10">
              <h3 className="text-xl md:text-2xl font-semibold text-blue-700">{editIndex !== null ? 'Edit Tautan' : 'Tambah Tautan'}</h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[64vh] space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-medium text-sm">Judul</label>
                  <input type="text" className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" value={formTautan.title} onChange={(e) => setFormTautan({ ...formTautan, title: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-sm">Deskripsi</label>
                  <textarea rows={4} className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 resize-y" value={formTautan.desc} onChange={(e) => setFormTautan({ ...formTautan, desc: e.target.value })} />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-sm">URL</label>
                  <input type="text" className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" value={formTautan.url} onChange={(e) => setFormTautan({ ...formTautan, url: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t sticky bottom-0 bg-white/60 z-10 flex justify-end gap-3">
              <Button variant="outline" size="sm" className="py-1 px-3 text-sm" onClick={closeTautanModal}>Batal</Button>
              <Button size="sm" className="py-1 px-3 text-sm" onClick={handleTautanSubmit}>Simpan</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
