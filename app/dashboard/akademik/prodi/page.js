"use client";
import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import Navbar from "@/app/components/Dashboard/Navbar";
import Footer from "@/app/components/Dashboard/Footer";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Loader2, Info } from "lucide-react";
import Image from 'next/image';

export default function ProdiAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prodiList, setProdiList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔍 Fitur tambahan
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAkreditasi, setFilterAkreditasi] = useState("Semua");
  const [sortBy, setSortBy] = useState("nama_asc");

  const [form, setForm] = useState({
    _id: null,
    nama: "",
    deskripsi: "",
    visi: "",
    misi: [""],
    akreditasi: "",
    tahun_akreditasi: "",
    dokumenFile: null,
    dokumenPreview: null,
    dokumenName: null,
    foto: null,
    preview: null,
  });

  // 🔹 Fetch data awal
  const fetchData = async () => {
    const res = await fetch("/api/akademik/prodi");
    const data = await res.json();
    setProdiList(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Open modal untuk tambah/edit
  const handleOpenModal = (id = null) => {
    if (id) {
      const p = prodiList.find((item) => item._id === id);
      if (!p) return;

      setForm({
        _id: p._id,
        nama: p.nama || "",
        deskripsi: p.deskripsi || "",
        visi: p.visi || "",
        misi: p.misi?.length ? p.misi : [""],
        akreditasi: p.akreditasi || "",
        tahun_akreditasi: p.tahun_akreditasi || "",
        dokumenFile: null,
        dokumenPreview: p.dokumenUrl_akreditasi || null,
        dokumenName: p.dokumenName_akreditasi || null,
        foto: null,
        preview: p.gambar || null,
      });
    } else {
      setForm({
        _id: null,
        nama: "",
        deskripsi: "",
        visi: "",
        misi: [""],
        akreditasi: "",
        tahun_akreditasi: "",
        dokumenFile: null,
        dokumenPreview: null,
        dokumenName: null,
        foto: null,
        preview: null,
      });
    }
    setShowModal(true);
  };

  // 🔹 Handle input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto" && files?.length) {
      const file = files[0];
      if (form.preview?.startsWith("blob:")) URL.revokeObjectURL(form.preview);
      setForm({ ...form, foto: file, preview: URL.createObjectURL(file) });
    } else if (name === "dokumen" && files?.length) {
      const file = files[0];
      if (form.dokumenPreview?.startsWith("blob:")) URL.revokeObjectURL(form.dokumenPreview);
      setForm({
        ...form,
        dokumenFile: file,
        dokumenPreview: URL.createObjectURL(file),
        dokumenName: file.name,
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // 🔹 Handle misi
  const handleMisiChange = (i, val) => {
    const newMisi = [...form.misi];
    newMisi[i] = val;
    setForm({ ...form, misi: newMisi });
  };
  const addMisi = () => setForm({ ...form, misi: [...form.misi, ""] });
  const removeMisi = (i) => {
    if (form.misi.length > 1) setForm({ ...form, misi: form.misi.filter((_, idx) => idx !== i) });
  };

  // 🔹 Hapus dokumen sebelum disimpan
  const clearChosenDokumen = () => {
    if (form.dokumenPreview?.startsWith("blob:")) URL.revokeObjectURL(form.dokumenPreview);
    setForm({ ...form, dokumenFile: null, dokumenPreview: null, dokumenName: null });
  };

  // 🔹 Save data (POST/PUT)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.deskripsi.trim()) {
      Swal.fire("Peringatan", "Nama dan Deskripsi wajib diisi!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nama", form.nama);
      formData.append("deskripsi", form.deskripsi);
      formData.append("visi", form.visi);

      // kirim misi sebagai array
      form.misi.forEach((m) => {
        if (m.trim()) formData.append("misi", m);
      });

      formData.append("akreditasi", form.akreditasi);
      formData.append("tahun_akreditasi", form.tahun_akreditasi);

      // ✅ penting: kirim ID jika edit
      if (form._id) formData.append("id", form._id);

      if (form.foto) formData.append("gambar", form.foto);
      if (form.dokumenFile) formData.append("dokumen", form.dokumenFile);

      const res = await fetch("/api/akademik/prodi", {
        method: form._id ? "PUT" : "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data");
      }

      const newData = await res.json();

      setProdiList((prev) =>
        form._id
          ? prev.map((p) => (p._id === form._id ? { ...p, ...newData } : p))
          : [...prev, newData]
      );

      setShowModal(false);
      Swal.fire("Berhasil", "Data Prodi berhasil disimpan.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };


  // 🔹 Delete
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data Prodi akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/akademik/prodi", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Gagal menghapus data");
      setProdiList((prev) => prev.filter((p) => p._id !== id));
      Swal.fire("Terhapus!", "Data Prodi berhasil dihapus.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // 🔍 Filter & sorting logic
  const filteredList = useMemo(() => {
    return prodiList
      .filter((p) =>
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((p) => (filterAkreditasi === "Semua" ? true : p.akreditasi === filterAkreditasi))
      .sort((a, b) => {
        if (sortBy === "nama_asc") return a.nama.localeCompare(b.nama);
        if (sortBy === "nama_desc") return b.nama.localeCompare(a.nama);
        if (sortBy === "tahun_asc") return (a.tahun_akreditasi || "").localeCompare(b.tahun_akreditasi || "");
        if (sortBy === "tahun_desc") return (b.tahun_akreditasi || "").localeCompare(a.tahun_akreditasi || "");
        return 0;
      });
  }, [prodiList, searchQuery, filterAkreditasi, sortBy]);

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="admin" />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : ""} flex flex-col`}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userData={{ role: "admin", nama: "Admin" }} />

        <main className="w-full max-w-7xl mx-auto px-4 pt-20 pb-24 flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 flex items-center gap-3"><Info className="w-6 h-6 text-[#2563eb]" />Manajemen Peraturan Akademik</h1>
                          <button
              onClick={() => handleOpenModal()}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
            >
              + Tambah Prodi
            </button>
          </div>

          {/* Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Cari nama atau deskripsi prodi..."
              className="border border-blue-200 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              value={filterAkreditasi}
              onChange={(e) => setFilterAkreditasi(e.target.value)}
              className="border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="Semua">Semua Akreditasi</option>
              <option value="Unggul">Unggul</option>
              <option value="Baik Sekali">Baik Sekali</option>
              <option value="Baik">Baik</option>
              <option value="Cukup">Cukup</option>
              <option value="Kurang">Kurang</option>
              <option value="Tidak Terakreditasi">Tidak Terakreditasi</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="nama_asc">Urut Nama (A-Z)</option>
              <option value="nama_desc">Urut Nama (Z-A)</option>
              <option value="tahun_desc">Tahun Akreditasi Terbaru</option>
              <option value="tahun_asc">Tahun Akreditasi Lama</option>
            </select>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.length > 0 ? (
              filteredList.map((prodi) => (
                <div key={prodi._id} className="bg-white rounded-2xl shadow hover:shadow-lg border border-blue-100 overflow-hidden flex flex-col transition">
                  <div className="h-48 bg-blue-50 overflow-hidden">
                    {prodi.gambar ? (
                      <Image src={prodi.gambar} alt={prodi.nama} width={1200} height={720} unoptimized className="w-full h-full object-cover hover:scale-105 transition" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-blue-300 font-semibold">Tidak Ada Gambar</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="font-bold text-blue-900 text-lg text-center mb-1">{prodi.nama}</h2>
                    <p className="text-sm text-blue-800 text-center line-clamp-3 mb-2">{prodi.deskripsi}</p>
                    <div className="text-xs text-gray-500 text-center mb-3">
                      Akreditasi: <span className="font-semibold text-blue-700">{prodi.akreditasi || "-"}</span> ({prodi.tahun_akreditasi || "–"})
                    </div>

                    <div className="flex justify-center gap-3 mt-auto mb-3">
                      {prodi.dokumenUrl_akreditasi ? (
                        <a href={prodi.dokumenUrl_akreditasi} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-900 px-3 py-1 rounded-md hover:bg-blue-200 text-xs font-bold">
                          Lihat Dokumen
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Belum ada dokumen</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3 md:mt-0 justify-center">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(prodi._id)}>
                        <Pencil className="w-4 h-4" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(prodi._id)}>
                        <Trash className="w-4 h-4" /> Hapus
                      </Button>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 italic col-span-full py-10">Tidak ada data ditemukan.</div>
            )}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-3">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  {form._id ? "Edit Program Studi" : "Tambah Program Studi"}
                </h2>

                {/* Form */}
                <form onSubmit={handleSave} className="flex flex-col gap-5">
                  {/* Nama */}
                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-1 block">Nama Program Studi</label>
                    <input type="text" name="nama" value={form.nama} onChange={handleChange} placeholder="Contoh: Sistem Informasi (S1)" className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400" required />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-1 block">Deskripsi Program Studi</label>
                    <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} placeholder="Tuliskan deskripsi singkat..." className="border border-gray-300 rounded-lg px-3 py-2 w-full resize-y min-h-[90px] focus:ring-2 focus:ring-blue-400" required />
                  </div>

                  {/* Visi */}
                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-1 block">Visi Program Studi</label>
                    <input type="text" name="visi" value={form.visi} onChange={handleChange} placeholder="Tuliskan visi program studi" className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400" />
                  </div>

                  {/* Misi */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Misi Program Studi</label>
                    <div className="flex flex-col gap-2">
                      {form.misi.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow transition">
                          <span className="text-gray-700 font-semibold w-5 text-center">{i + 1}.</span>
                          <input type="text" value={m} onChange={(e) => handleMisiChange(i, e.target.value)} placeholder={`Tuliskan Misi ${i + 1}`} className="flex-1 border-none outline-none bg-transparent focus:ring-0 text-sm text-gray-900" />
                          <button type="button" onClick={() => removeMisi(i)} className="text-red-500 hover:text-red-700 transition" title="Hapus misi">✕</button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addMisi} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 transition">
                      <span className="text-lg leading-none">＋</span> Tambah Misi
                    </button>
                  </div>

                  {/* Akreditasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-1 block">Akreditasi</label>
                      <select name="akreditasi" value={form.akreditasi} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 bg-white">
                        <option value="">Pilih Akreditasi</option>
                        <option value="Unggul">Unggul</option>
                        <option value="Baik Sekali">Baik Sekali</option>
                        <option value="Baik">Baik</option>
                        <option value="Cukup">Cukup</option>
                        <option value="Kurang">Kurang</option>
                        <option value="Tidak Terakreditasi">Tidak Terakreditasi</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-1 block">Tahun Akreditasi</label>
                      <input type="text" name="tahun_akreditasi" value={form.tahun_akreditasi} onChange={handleChange} placeholder="Contoh: 2023" className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>

                  {/* Dokumen PDF */}
                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-1 block">
                      Dokumen Akreditasi (PDF)
                    </label>

                    <div className="relative w-full">
                      {/* Input readonly menampilkan nama file PDF */}
                      <input
                        type="text"
                        readOnly
                        value={form.dokumen?.name || ""}
                        placeholder="Belum ada file dipilih"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-sm"
                        tabIndex={-1}
                      />

                      {/* Tombol pilih file */}
                      <label className="absolute top-1/2 right-2 -translate-y-1/2">
                        <input
                          type="file"
                          name="dokumen"
                          accept="application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleChange}
                        />
                        <span className="inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded-md font-semibold cursor-pointer hover:bg-blue-700 transition">
                          Pilih File
                        </span>
                      </label>
                    </div>

                    {/* Preview Dokumen */}
                    <div className="mt-2 flex items-center gap-3">
                      {form.dokumenPreview ? (
                        <>
                          <a
                            href={form.dokumenPreview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-700 font-medium underline hover:text-blue-800 transition"
                          >
                            {form.dokumenName || "Lihat Dokumen"}
                          </a>
                          <button
                            type="button"
                            onClick={clearChosenDokumen}
                            className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded hover:bg-red-200 transition"
                          >
                            Hapus
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 italic">
                          Belum memilih dokumen
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Foto */}
                  <div>
                    <label className="text-sm font-semibold text-gray-800 mb-1 block">
                      Gambar Program Studi
                    </label>

                    <div className="relative w-full">
                      {/* Input readonly untuk menampilkan nama file */}
                      <input
                        type="text"
                        readOnly
                        value={form.foto?.name || ""}
                        placeholder="Belum ada file dipilih"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-sm"
                        tabIndex={-1}
                      />

                      {/* Tombol pilih file */}
                      <label className="absolute top-1/2 right-2 -translate-y-1/2">
                        <input
                          type="file"
                          name="foto"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleChange}
                        />
                        <span className="inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded-md font-semibold cursor-pointer hover:bg-blue-700 transition">
                          Pilih File
                        </span>
                      </label>
                    </div>

                    {/* Preview Gambar */}
                    {form.preview && (
                      <div className="mt-3 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <Image src={form.preview} alt="Preview" width={800} height={400} unoptimized className="w-full h-48 object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Tombol aksi */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
                    <button type="submit" disabled={isSubmitting} className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:bg-blue-400 inline-flex items-center gap-2 justify-center" >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      <span>{isSubmitting ? "Menyimpan..." : "Simpan"}</span>
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition" > Batal </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
