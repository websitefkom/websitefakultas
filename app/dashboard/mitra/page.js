"use client";
import { useState, useEffect, useCallback } from "react";
import Navbar from "@/app/components/Dashboard/Navbar";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import Footer from "@/app/components/Dashboard/Footer";
import Image from "next/image";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";

export default function AdminMitra() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [nama, setNama] = useState("");
  const [link, setLink] = useState("");
  const [urutan, setUrutan] = useState(0);
  const [aktif, setAktif] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mitra");
      const json = await res.json();
      setList(Array.isArray(json) ? json : json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setNama("");
    setLink("");
    setUrutan(0);
    setAktif(true);
    setLogoFile(null);
    setLogoPreview(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setNama(item.nama || "");
    setLink(item.link || "");
    setUrutan(item.urutan ?? 0);
    setAktif(item.aktif !== false);
    setLogoFile(null);
    setLogoPreview(item.logo || null);
    setModalOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      Swal.fire("Error", "Nama mitra wajib diisi", "error");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("nama", nama);
      form.append("link", link);
      form.append("urutan", String(urutan));
      form.append("aktif", String(aktif));
      if (logoFile) form.append("logo", logoFile);
      if (editing) form.append("id", String(editing._id));

      const res = await fetch("/api/mitra", {
        method: editing ? "PUT" : "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }
      setModalOpen(false);
      fetchList();
      Swal.fire(
        "Berhasil",
        editing ? "Mitra berhasil diperbarui" : "Mitra berhasil ditambahkan",
        "success"
      );
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Mitra?",
      text: `"${item.nama}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch("/api/mitra", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(item._id) }),
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchList();
      Swal.fire("Terhapus", "Mitra berhasil dihapus", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : ""
        }`}
      >
        <Navbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="w-full max-w-7xl mx-auto px-4 pt-20 pb-24 flex-1">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Mitra Kami</h1>
                <p className="text-sm text-gray-500">
                  Kelola daftar mitra dan partner fakultas
                </p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus />
                Tambah Mitra
              </button>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-4 border-b animate-pulse"
                  >
                    <div className="w-16 h-10 bg-gray-200 rounded" />
                    <div className="flex-1 h-4 bg-gray-200 rounded w-1/3" />
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-12 h-4 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="bg-white rounded-xl shadow text-center py-20 text-gray-500">
                Belum ada data mitra. Klik &ldquo;Tambah Mitra&rdquo; untuk menambahkan.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Logo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Link
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Urutan
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {list.map((item) => (
                      <tr
                        key={String(item._id)}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {item.logo ? (
                            <div className="relative w-16 h-10">
                              <Image
                                src={item.logo}
                                alt={item.nama}
                                fill
                                sizes="64px"
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                              No logo
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {item.nama}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {item.link}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {item.urutan}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.aktif
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.aktif ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <FiEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              title="Hapus"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editing ? "Edit Mitra" : "Tambah Mitra"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Mitra <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama perusahaan / institusi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website / Link
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                {logoPreview && (
                  <div className="relative w-32 h-16 mb-2 border rounded overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Preview logo"
                      fill
                      sizes="128px"
                      className="object-contain"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full text-sm text-gray-600"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={urutan}
                    onChange={(e) => setUrutan(Number(e.target.value))}
                    min={0}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={aktif}
                      onChange={(e) => setAktif(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
