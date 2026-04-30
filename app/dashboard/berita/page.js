"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "@/app/components/Dashboard/Navbar";
import Sidebar from "@/app/components/Dashboard/Sidebar";
import Footer from "@/app/components/Dashboard/Footer";
import BeritaEditor from "@/app/components/Dashboard/BeritaEditor";
import Image from "next/image";
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiEdit,
  FiX,
  FiMinimize2,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { AiOutlineReload } from "react-icons/ai";

// Inline styles will be used for modal overlays and panels below for clarity

export default function AdminBerita() {
  // local styles for small animations
  const localStyles = `
    @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 350ms ease-out forwards; }
    @keyframes modal-in { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .animate-modal-in { animation: modal-in 240ms cubic-bezier(.2,.9,.2,1) forwards; }
  `;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [list, setList] = useState([]);
  const [lastCreatedId, setLastCreatedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // modal state
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editorKey, setEditorKey] = useState("new");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  // form extras
  const [kategori, setKategori] = useState("Umum");
  const [status, setStatus] = useState("draft");
  const [penulis, setPenulis] = useState("Admin");
  const [tags, setTags] = useState("");

  // ✅ tampilkan X data per halaman
  const pageSize = 21;
  // We intentionally call fetchList when page/query/statusFilter change.
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      // include status filter in request
      const res = await fetch(
        `/api/berita?page=${page}&limit=${pageSize}&q=${encodeURIComponent(
          query
        )}&status=${encodeURIComponent(statusFilter)}`
      );
      if (!res.ok) throw new Error("Gagal mengambil daftar berita");
      const json = await res.json();

      // Support two response shapes:
      // 1) Array of items (legacy): json = [ ... ]
      // 2) Paginated object: json = { data: [...], total, totalPages }
      let data = [];
      let total = 0;
      let totalPagesFromApi = 1;

      if (Array.isArray(json)) {
        // API returned full array: paginate on client
        total = json.length;
        totalPagesFromApi = Math.max(1, Math.ceil(total / pageSize));
        const start = (Math.max(1, page) - 1) * pageSize;
        data = json.slice(start, start + pageSize);
      } else if (json && Array.isArray(json.data)) {
        // API already returned paginated data for this page — use it as-is
        total = typeof json.total === "number" ? json.total : json.data.length;
        totalPagesFromApi =
          typeof json.totalPages === "number"
            ? json.totalPages
            : Math.max(1, Math.ceil(total / pageSize));
        data = json.data; // don't slice again — server already applied skip/limit
      }

      // If current page is out of range (e.g., data reduced), clamp it
      if (page > totalPagesFromApi) {
        setPage(totalPagesFromApi);
      }

      setList(data);
      setTotalPages(totalPagesFromApi);
      setTotalItems(total);
      // clear new-item highlight after short delay
      if (lastCreatedId) {
        setTimeout(() => setLastCreatedId(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setList([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter, pageSize, lastCreatedId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setKategori("Umum");
    setStatus("draft");
    setPenulis("Admin");
    setTags("");
    setEditorKey("new-" + Date.now());
    setModalOpen(true);
  }

  // Close modal and reset fullscreen
  function closeModal() {
    setModalOpen(false);
    setIsFullScreen(false);
  }

  function openEdit(item) {
    setModalOpen(true);
    setIsFetching(true);
    (async () => {
      try {
        const res = await fetch(`/api/berita/${item._id}`);
        if (!res.ok) throw new Error("Gagal fetch data berita");
        const json = await res.json();
        setEditing(json);
        setTitle(json.judul || "");
        setContent(json.isi || "");
        setImagePreview(json.gambarJudul || null);
        setKategori(json.kategori || "Umum");
        setStatus(json.status || "draft");
        setPenulis(json.penulis || "Admin");
        setTags((json.tags && json.tags.join(",")) || "");
        setEditorKey(`${json._id}-${Date.now()}`);
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Terjadi kesalahan saat mengambil data berita.",
        });
      } finally {
        setIsFetching(false);
      }
    })();
  }

  function onImageChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    // validate size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (f.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "File terlalu besar",
        text: "Ukuran gambar maksimal 2MB.",
      });
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function submitSave() {
    const action = editing ? "Perbarui" : "Buat";
    const result = await Swal.fire({
      title: `${action} berita?`,
      text: "Pastikan data sudah benar sebelum menyimpan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: action,
    });
    if (!result.isConfirmed) return;

    // validation
    if (!title || title.trim().length < 5) {
      Swal.fire({
        icon: "error",
        title: "Judul tidak valid",
        text: "Judul minimal 5 karakter.",
      });
      return;
    }
    if (!content || content.trim().length === 0) {
      Swal.fire({
        icon: "error",
        title: "Isi kosong",
        text: "Isi berita wajib diisi.",
      });
      return;
    }

    setIsSubmitting(true);
    setSavingId(editing ? editing._id : "new");
    try {
      const form = new FormData();
      form.append("judul", title);
      form.append("isi", content);
      if (imageFile) form.append("gambarJudul", imageFile);
      if (editing) form.append("id", editing._id);
      // extras
      form.append("kategori", kategori);
      form.append("status", status);
      form.append("penulis", penulis);
      form.append("tags", tags);

      const url = "/api/berita";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, body: form });
      if (!res.ok) throw new Error("Gagal menyimpan berita");
      const json = await res.json();
      setModalOpen(false);
      if (!editing) setLastCreatedId(json.berita?._id || null);
      fetchList();
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Berita tersimpan.",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal menyimpan berita.",
      });
    } finally {
      setIsSubmitting(false);
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    const result = await Swal.fire({
      title: "Hapus berita?",
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/berita", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchList();
      Swal.fire({
        icon: "success",
        title: "Dihapus",
        text: "Berita berhasil dihapus.",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal menghapus berita.",
      });
    }
  }

  async function changeStatus(id, newStatus) {
    try {
      const form = new FormData();
      form.append("id", id);
      form.append("status", newStatus);
      const res = await fetch("/api/berita", { method: "PUT", body: form });
      if (!res.ok) throw new Error("Gagal mengubah status");
      fetchList();
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Status diperbarui.",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal mengubah status.",
      });
    }
  }

  function refresh() {
    setPage(1);
    fetchList();
  }

  function openPreview(item) {
    setPreviewItem(item);
    setPreviewOpen(true);
  }

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen w-full">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole="admin"
      />
   <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : ""} flex flex-col`}>
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userData={{ role: "admin", nama: "Admin" }}
        />
        <main className="w-full max-w-7xl mx-auto px-4 pt-20 pb-24 flex-1">
          <style dangerouslySetInnerHTML={{ __html: localStyles }} />
          <div className="max-w-7xl mx-auto px-4 py-8 min-h-[80vh]">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
              <ol className="list-reset flex items-center gap-2">
                <li>Dashboard</li>
                <li>/</li>
                <li className="text-gray-700 font-medium">Berita</li>
              </ol>
            </nav>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Manajemen Berita</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Cari berita..."
                    className="pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                </div>
                <button
                  onClick={refresh}
                  aria-label="refresh data"
                  className="inline-flex items-center gap-2 bg-white text-gray-700 px-3 py-2 rounded-lg shadow hover:bg-gray-50 transition"
                >
                  <AiOutlineReload /> Refresh
                </button>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 bg-[#2563eb] text-white px-4 py-3 rounded-2xl shadow hover:bg-[#1e40af] transition-transform"
                >
                  <FiPlus /> Buat Berita
                </button>
              </div>
            </div>

            {/* Filter & summary */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {["all", "draft", "published", "archived"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(1);
                    }}
                    className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-all  ${
                      statusFilter === s
                        ?  'text-[#2563eb]'
                        : 'text-[#6b7280] hover:text-[#2563eb]'
                    }`}
                  >
                    {s === "all"
                      ? "Semua"
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                    <span
                      className={`block h-1 mt-2 transition-all ${
                        statusFilter === s
                          ? "bg-[#2563eb] rounded-t-full"
                          : "bg-transparent"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Menampilkan <span className="font-medium">{list.length}</span>{" "}
                dari <span className="font-medium">{totalItems}</span> berita
              </div>
            </div>

            {/* List berita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // skeletons with fade-in
                Array.from({ length: pageSize }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow p-4 h-64 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                  />
                ))
              ) : list.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-20">
                  Belum ada berita.
                </div>
              ) : (
                list.map((item) => {
                  const isNew =
                    lastCreatedId &&
                    (lastCreatedId === "new" || lastCreatedId === item._id);
                  return (
                    <article
                      key={item._id}
                      className={`bg-white rounded-xl shadow p-4 flex flex-col hover:shadow-lg transition-shadow transform ${
                        isNew ? "ring-2 ring-indigo-300" : ""
                      }`}
                    >
                      <div className="relative w-full h-40 rounded-md overflow-hidden mb-3 bg-gray-100">
                        {item.gambarJudul ? (
                          <Image
                            src={item.gambarJudul}
                            alt={item.judul}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            No Image
                          </div>
                        )}
                        {/* status badge */}
                        <div
                          className="absolute left-3 top-3 px-2 py-1 rounded-full text-xs font-semibold text-white"
                          style={{
                            background:
                              item.status === "published"
                                ? "#2563EB"
                                : item.status === "draft"
                                ? "#6B7280"
                                : "#7C3AED",
                          }}
                        >
                          {item.status}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.judul}
                      </h3>
                      <div
                        className="text-sm text-gray-600 mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html:
                            String(item.isi || "")
                              .replace(/<[^>]+>/g, "")
                              .slice(0, 150) + "...",
                        }}
                      />
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-500">
                          {new Date(
                            item.updatedAt || item.createdAt
                          ).toLocaleDateString("id-ID")}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPreview(item)}
                            aria-label="preview"
                            className="px-3 py-1 text-sm rounded-2xl bg-white text-blue-900 shadow-sm ring-1 ring-blue-100 hover:scale-105 transition"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            aria-label="edit"
                            className="inline-flex items-center justify-center p-2 rounded-2xl bg-white text-blue-900 shadow-sm ring-1 ring-blue-100 hover:scale-105 transition"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            aria-label="hapus"
                            className="inline-flex items-center gap-2 p-2 rounded-2xl bg-[#fff1f2] text-red-600 border border-[#fee2e2] hover:bg-[#fee2e2] transition"
                          >
                            <FiTrash2 />
                          </button>
                          {item.status !== "published" ? (
                            <button
                              onClick={() =>
                                changeStatus(item._id, "published")
                              }
                              className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                            >
                              Publikasikan
                            </button>
                          ) : (
                            <button
                              onClick={() => changeStatus(item._id, "draft")}
                              className="px-2 py-1 bg-yellow-500 text-white rounded text-sm"
                            >
                              Kembalikan Draft
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* ✅ Pagination — lebih profesional, responsive */}
            <div className="mt-10 mb-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-medium">{list.length}</span>{" "}
                  dari <span className="font-medium">{totalItems}</span> berita
                </div>

                <div className="inline-flex items-center gap-3 bg-white rounded-lg shadow-sm border px-3 py-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    aria-label="Sebelumnya"
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      page === 1 || loading
                        ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                        : "text-[#2563eb] hover:bg-[#eef6ff]"
                    }`}
                  >
                    Sebelumnya
                  </button>

                  <div className="px-3 py-1 text-sm font-medium text-gray-700">
                    Hal {page} dari {totalPages}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    aria-label="Selanjutnya"
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      page === totalPages || loading
                        ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                        : "text-[#2563eb] hover:bg-[#eef6ff]"
                    }`}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Preview Modal */}
        {previewOpen && previewItem && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className="bg-white max-w-4xl w-[95%] md:w-full rounded-2xl p-6 relative transform transition-all duration-200 ease-out border border-gray-100 shadow-2xl"
              style={{ maxHeight: "90vh", overflow: "hidden" }}
            >
              <button
                onClick={() => setPreviewOpen(false)}
                aria-label="close preview"
                className="absolute right-3 top-3 p-2"
              >
                <FiX />
              </button>
              <h2 className="text-2xl font-serif font-bold mb-3">
                {previewItem.judul}
              </h2>
              <div className="text-sm text-gray-500 mb-4">
                Penulis: {previewItem.penulis || "Admin"} —{" "}
                {new Date(
                  previewItem.updatedAt || previewItem.createdAt
                ).toLocaleString("id-ID")}
              </div>
              <div
                className="prose max-w-none overflow-y-auto"
                style={{ maxHeight: "75vh" }}
                dangerouslySetInnerHTML={{ __html: previewItem.isi || "" }}
              />
            </div>
          </div>
        )}

        {/* Editor Modal */}
        {modalOpen && (
          <div
            className={
              isFullScreen
                ? "fixed inset-0 z-[60] bg-white flex items-stretch justify-center"
                : "fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
            }
          >
            <div
              className={
                isFullScreen
                  ? "fixed inset-0 z-[60] bg-white flex flex-col w-full h-full rounded-none shadow-none p-0 transition-all"
                  : "bg-white max-w-4xl w-[95%] md:w-full rounded-2xl relative transform transition-all duration-200 ease-out border border-gray-100 shadow-2xl animate-modal-in"
              }
              style={isFullScreen ? {} : { maxHeight: "85vh" }}
            >
              {/* Header: hide when fullscreen */}
              {!isFullScreen && (
                <div className="border-b px-6 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-8 rounded-md"
                      style={{ background: "#2563eb" }}
                    />
                    <div>
                      <div className="text-lg font-semibold">
                        {editing ? "Edit Berita" : "Buat Berita"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Kelola konten berita dengan teliti
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeModal}
                      className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded"
                    >
                      <FiX /> Tutup
                    </button>
                  </div>
                </div>
              )}

              <div
                className={
                  isFullScreen ? "flex-1 w-full h-full" : "p-6 overflow-y-auto"
                }
                style={
                  isFullScreen
                    ? { height: "100vh" }
                    : { maxHeight: "calc(85vh - 112px)" }
                }
              >
                <div
                  className={`grid grid-cols-1 ${isFullScreen ? "" : "md:grid-cols-2"} gap-6 ${
                    isFullScreen ? "h-full" : ""
                  }`}
                >
                  {/* Informasi Utama */}
                  <section className={`space-y-3 ${isFullScreen ? "h-full" : ""}`}>
                    <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Informasi Utama{" "}
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#facc15" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Judul
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-[#2563eb]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Isi
                      </label>
                      <div className={`mb-3 ${isFullScreen ? "h-full" : ""}`} style={isFullScreen ? { height: "100%" } : undefined}>
                        <BeritaEditor
                          key={editorKey}
                          initialValue={content}
                          onChange={(val) => setContent(val)}
                          onToggleFullScreen={(v) => setIsFullScreen(!!v)}
                          isFullScreen={isFullScreen}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Detail Berita */}
                  <section className="space-y-4">
                    <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Detail Berita
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Kategori
                        </label>
                        <select
                          value={kategori}
                          onChange={(e) => setKategori(e.target.value)}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option>Teknologi</option>
                          <option>Pendidikan</option>
                          <option>Event</option>
                          <option>Umum</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Penulis
                        </label>
                        <input
                          value={penulis}
                          onChange={(e) => setPenulis(e.target.value)}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tags (pisah koma)
                        </label>
                        <input
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Gambar Judul
                        </label>
                        <div className="relative w-full">
                          {/* readonly input showing filename */}
                          <input
                            type="text"
                            readOnly
                            value={imageFile ? imageFile.name : ""}
                            placeholder="Belum ada file dipilih"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition text-sm"
                            tabIndex={-1}
                          />

                          {/* floating file picker button */}
                          <label className="absolute top-1/2 right-2 -translate-y-1/2">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={onImageChange}
                            />
                            <span className="inline-block bg-[#2563eb] text-white text-sm px-3 py-1 rounded-md font-semibold cursor-pointer hover:bg-[#1e40af] transition">
                              Pilih File
                            </span>
                          </label>
                        </div>

                        {imagePreview && (
                          <div className="mt-2 rounded overflow-hidden border border-gray-100 shadow-sm">
                            <div className="w-full h-40 relative">
                              <Image
                                src={imagePreview}
                                alt="preview"
                                fill
                                unoptimized
                                className="object-cover rounded-t-md"
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1 px-2 py-1">
                              {imageFile ? imageFile.name : "Current image"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* sticky footer actions - hide when fullscreen */}
              {!isFullScreen && (
                <div className="border-t py-3 px-4 bg-white sticky bottom-0 flex items-center gap-3 justify-end">
                  <button
                    onClick={closeModal}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitSave}
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white rounded px-4 py-2 flex items-center gap-2 text-sm"
                  >
                    {isSubmitting ? (
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    ) : null}
                    <span>
                      {isSubmitting
                        ? "Menyimpan..."
                        : editing
                        ? "Perbarui"
                        : "Buat"}
                    </span>
                  </button>
                </div>
              )}

              {/* fullscreen floating toolbar (when in fullscreen) */}
              {isFullScreen && (
                <div className="fixed top-4 right-4 z-[61] flex items-center gap-2">
                  <button
                    onClick={submitSave}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-[#2563eb] text-white px-3 py-2 rounded-md shadow hover:bg-[#1e40af] transition"
                  >
                    {isSubmitting ? (
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    ) : null}
                    <span className="text-sm">
                      {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </span>
                  </button>
                  <button
                    onClick={() => setIsFullScreen(false)}
                    title="Exit Fullscreen"
                    className="inline-flex items-center gap-2 bg-white text-[#2563eb] px-3 py-2 rounded-md border border-[#e6eefb] shadow-sm hover:bg-[#f8fbff] transition"
                  >
                    <FiMinimize2 /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
}
