"use client";
import { useState, useEffect, Fragment } from "react";
import Swal from "sweetalert2";
import { Loader2, FileText, File, Pencil, Trash, Plus, Info, Download, MoreVertical, Save, UploadCloud, Eye } from 'lucide-react';
import Sidebar from "@/app/components/Dashboard/Sidebar";
import Navbar from "@/app/components/Dashboard/Navbar";
import Footer from "@/app/components/Dashboard/Footer";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { Button } from "@/components/ui/button";
// Build viewer URL for a document object.
// Prioritize cloudinaryUrl because Google Docs Viewer requires a publicly accessible URL.
// A relative proxy path (/api/...) or localhost URL will cause "No preview available".
function getDocViewerUrl(doc) {
  if (!doc) return null;
  // Cloudinary URL is always publicly accessible — use it first
  if (doc.cloudinaryUrl) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(doc.cloudinaryUrl)}&embedded=true`;
  }
  // Fallback: convert proxy path to absolute (works only when server is publicly deployed)
  const proxyPath = doc.fileId
    ? `/api/akademik/peraturan/dokumen/file/${doc.fileId}`
    : (doc.url || '');
  if (!proxyPath) return null;
  try {
    const absolute = new URL(proxyPath, typeof window !== 'undefined' ? window.location.origin : 'https://example.com').toString();
    return `https://docs.google.com/viewer?url=${encodeURIComponent(absolute)}&embedded=true`;
  } catch (e) {
    return null;
  }
}

// Modal untuk tambah/edit dokumen
function DokumenModal({ open, onClose, onSubmit, initial }) {
  const [name, setName] = useState(initial?.dokumenName || "");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initial?.dokumenName || "");
    setFile(null);
    setErrors({});
    setSubmitting(false);
  }, [open, initial]);

  const validate = () => {
    const e = {};
    if (!name || !name.trim()) e.name = "Nama dokumen wajib diisi";
    if (!initial && !file) e.file = "File dokumen wajib diunggah";
    return e;
  };

  const handleClick = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      Swal.fire("Gagal!", "Periksa kembali form Anda.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), file });
      setTimeout(() => onClose?.(), 200);
      Swal.fire("Berhasil!", `Dokumen ${initial ? 'diperbarui' : 'ditambahkan'} berhasil.`, "success");
    } catch (err) {
      Swal.fire("Gagal!", err?.message || "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="ease-in duration-150"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-blue-50 transform transition-all duration-200 backdrop-blur-sm">
              <Dialog.Title className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#2563eb]" />
                <span>{initial ? "Edit Dokumen" : "Tambah Dokumen"}</span>
              </Dialog.Title>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Nama Dokumen</label>
                  <input
                    type="text"
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#2563eb] focus:outline-none transition ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama dokumen"
                    autoFocus
                    disabled={submitting}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">File Dokumen (PDF/DOCX)</label>
                  <div
                    className={`w-full rounded-lg border-dashed ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'} border px-3 py-6 flex items-center justify-between gap-4 transition-all duration-150 overflow-hidden`}
                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); const dropped = e.dataTransfer.files?.[0]; if (dropped) setFile(dropped); }}
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-md bg-gradient-to-b from-[#f0f9ff] to-white text-[#2563eb]">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 overflow-hidden flex-1">
                          <div className="font-medium text-sm text-gray-800 truncate max-w-full">{file ? file.name : (initial?.url ? 'File terpasang (klik Lihat)' : 'Tarik dan lepas file di sini atau pilih file')}</div>
                          <div className="text-xs text-gray-500 truncate">{file ? `${Math.round(file.size/1024)} KB — ${file.type || 'File'}` : 'Format: .pdf, .doc, .docx'}</div>
                        </div>
                      </div>
                      {errors.file && <p className="mt-2 text-xs text-red-600">{errors.file}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files[0])} disabled={submitting} />
                        <span className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1e40af] text-white px-4 py-2 rounded-lg text-sm"> <Plus className="w-4 h-4"/> Pilih File</span>
                      </label>
                      {file && (
                        <button type="button" onClick={() => setFile(null)} className="text-xs text-gray-600 underline">Hapus file</button>
                      )}
                      {initial && !file && ( // use doc-aware viewer URL
                        <a href={getDocViewerUrl(initial)} target="_blank" rel="noreferrer" className="text-sm text-[#2563eb] underline mt-1">{initial?.dokumenName || 'Lihat file terpasang'}</a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button type="button" onClick={onClose} className="min-h-[40px] px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition focus:ring-2 focus:ring-blue-300" disabled={submitting}>Batal</button>
                  <button type="button" onClick={handleClick} disabled={submitting} className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white font-medium disabled:opacity-60 flex items-center gap-2 focus:ring-2 focus:ring-blue-300">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function PeraturanAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('ketentuan');
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null); // section name
  const [removingIdx, setRemovingIdx] = useState(null);

  // Data lama (dari DB)
  const [ketentuan, setKetentuan] = useState("");
  const [kebijakan, setKebijakan] = useState("");
  const [persyaratan, setPersyaratan] = useState([""]);
  const [jalur, setJalur] = useState("");
  const [penetapan, setPenetapan] = useState("");
  const [dokumen, setDokumen] = useState([]);

  // Data input baru
  const [newKetentuan, setNewKetentuan] = useState("");
  const [newKebijakan, setNewKebijakan] = useState("");
  const [newPersyaratan, setNewPersyaratan] = useState([""]);
  const [newJalur, setNewJalur] = useState("");
  const [newPenetapan, setNewPenetapan] = useState("");

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDocIdx, setEditDocIdx] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Accordion helper for mobile with image zoom animation
  function AccordionSection({ id, title, icon: Icon, children, initiallyOpen = false }) {
    const [open, setOpen] = useState(initiallyOpen);
    return (
      <div className="border-b border-gray-100">
        <button
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
          className="w-full flex items-center justify-between gap-3 p-4 bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gradient-to-b from-[#f0f9ff] to-white text-[#2563eb]">
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-gray-800">{title}</div>
          </div>
          <div className="text-sm text-gray-500">{open ? 'Tutup' : 'Buka'}</div>
        </button>

        {/* decorative image that zooms on open/close */}
        <div className="overflow-hidden transition-transform duration-500 ease-in-out bg-white">
          <div className={`transform transition-transform duration-500 ${open ? 'scale-105' : 'scale-100'}`}>
            <div className="p-4">{open && children}</div>
          </div>
        </div>
      </div>
    );
  }

  // Small wrappers to reuse the existing section JSX inside the accordion
  function KetentuanContent() {
    return (
      <>
        <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-line">{ketentuan || 'Belum ada data'}</p>
        </div>
        <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#2563eb]" value={newKetentuan} onChange={(e) => setNewKetentuan(e.target.value)} placeholder="Masukkan ketentuan baru..." />
        <div className="flex justify-end mt-4">
          <button onClick={() => handleSave('ketentuan', newKetentuan)} disabled={savingSection === 'ketentuan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'ketentuan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
            {savingSection === 'ketentuan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1">Simpan</span>
          </button>
        </div>
      </>
    );
  }

  function KebijakanContent() {
    return (
      <>
        <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-line">{kebijakan || 'Belum ada data'}</p>
        </div>
        <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900" value={newKebijakan} onChange={(e) => setNewKebijakan(e.target.value)} placeholder="Masukkan kebijakan baru..." />
        <div className="flex justify-end mt-4">
          <button onClick={() => handleSave('kebijakan', newKebijakan)} disabled={savingSection === 'kebijakan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'kebijakan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
            {savingSection === 'kebijakan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1">Simpan</span>
          </button>
        </div>
      </>
    );
  }

  function PersyaratanContent() {
    return (
      <>
        <ul className="space-y-3 mt-3">
          {persyaratan.map((item, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <div className="flex-1">
                <input type="text" className="w-full border border-gray-200 rounded p-2 text-sm" value={item} onChange={(e) => handlePersyaratanChange(idx, e.target.value)} placeholder={`Persyaratan ${idx + 1}`} />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="destructive" onClick={() => handleRemovePersyaratan(idx)} disabled={persyaratan.length === 1}>Hapus</Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={handleAddPersyaratan} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#facc15] hover:bg-yellow-400 text-black font-medium"><Plus className="w-4 h-4"/>Tambah</button>
          <div className="flex-1" />
          <button onClick={() => handleSave('persyaratan', persyaratan)} disabled={savingSection === 'persyaratan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'persyaratan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
            {savingSection === 'persyaratan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1">Simpan</span>
          </button>
        </div>
      </>
    );
  }

  function JalurContent() {
    return (
      <>
        <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-line">{jalur || 'Belum ada data'}</p>
        </div>
        <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900" value={newJalur} onChange={(e) => setNewJalur(e.target.value)} placeholder="Masukkan jalur baru..." />
        <div className="flex justify-end mt-4">
          <button onClick={() => handleSave('jalur', newJalur)} disabled={savingSection === 'jalur'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'jalur' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
            {savingSection === 'jalur' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1">Simpan</span>
          </button>
        </div>
      </>
    );
  }

  function PenetapanContent() {
    return (
      <>
        <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-line">{penetapan || 'Belum ada data'}</p>
        </div>
        <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900" value={newPenetapan} onChange={(e) => setNewPenetapan(e.target.value)} placeholder="Masukkan penetapan baru..." />
        <div className="flex justify-end mt-4">
          <button onClick={() => handleSave('penetapan', newPenetapan)} disabled={savingSection === 'penetapan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'penetapan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
            {savingSection === 'penetapan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1">Simpan</span>
          </button>
        </div>
      </>
    );
  }

  function DokumenContent() {
    return (
      <>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Dokumen Terkait</h3>
          <button onClick={() => setAddModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2563eb] hover:bg-[#1e40af] text-white"><UploadCloud className="w-4 h-4"/>Tambah</button>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-1">Daftar dokumen yang dapat diunduh atau diedit</p>
        {dokumen.length === 0 ? (
          <p className="text-gray-500 text-sm mt-3">Belum ada dokumen.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 mt-3">
            {dokumen.map((doc, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:bg-[#f9fafb]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md bg-gradient-to-b from-[#f0f9ff] to-white text-[#2563eb]">
                      <FileText className="w-6 h-6" />
                    </div>
                      <div className="min-w-0">
                      {(doc.fileId || doc.cloudinaryUrl || doc.url) ? (
                        <a href={getDocViewerUrl(doc)} target="_blank" rel="noreferrer" className="font-semibold text-sm text-[#374151] truncate underline">{doc.dokumenName || '(Tanpa judul)'}</a>
                      ) : (
                        <div className="font-semibold text-sm text-[#374151] truncate">{doc.dokumenName || '(Tanpa judul)'}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="p-1 rounded hover:bg-gray-100 focus:outline-none" aria-label={`Menu tindakan untuk ${doc.dokumenName}`}>
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </Menu.Button>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                          <Menu.Items className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-lg shadow-lg focus:outline-none z-50">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => handleEditDokumen(idx)} className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}>
                                    Edit
                                  </button>
                                )}
                              </Menu.Item>
                              {(doc.fileId || doc.cloudinaryUrl || doc.url) && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <a href={getDocViewerUrl(doc)} target="_blank" rel="noreferrer" className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}>
                                      {doc.dokumenName || 'Lihat / Unduh'}
                                    </a>
                                  )}
                                </Menu.Item>
                              )}
                              <Menu.Item>
                                {({ active }) => (
                                  <button onClick={() => handleRemoveDokumen(idx)} disabled={removingIdx === idx} className={`w-full text-left px-4 py-2 text-sm text-red-600 ${active ? 'bg-gray-100' : ''}`}>
                                    Hapus
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-[#6b7280]">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'Tanggal tidak tersedia'}
                    {doc.size && <span> • {Math.round(doc.size/1024)} KB</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {(doc.fileId || doc.cloudinaryUrl || doc.url) && (
                      <Button size="sm" variant="outline" onClick={() => window.open(getDocViewerUrl(doc), '_blank')}>
                        <Eye className="w-4 h-4" /> Lihat
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEditDokumen(idx)} disabled={savingSection === 'edit-doc' || savingSection === 'add-doc'}>
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveDokumen(idx)} disabled={removingIdx === idx}>
                      {removingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />} Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // Fetch data awal
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/akademik/peraturan/");
      if (!res.ok) throw new Error("Gagal ambil data awal");
      const data = await res.json();
      setKetentuan(data.ketentuan || "");
      setKebijakan(data.kebijakan || "");
      setJalur(data.jalur || "");
      setPenetapan(data.penetapan || "");
      setPersyaratan(data.persyaratan?.length ? data.persyaratan : [""]);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak bisa memuat data awal!', iconColor: '#ef4444', confirmButtonColor: '#2563eb' });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const res = await fetch("/api/akademik/peraturan/dokumen");
      const data = await res.json();
      if (data.success) {
        if (data.dokumen) setDokumen(data.dokumen);
        else if (data.data?.dokumen) setDokumen(data.data.dokumen);
        else setDokumen([]);
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchData();
    refreshData();
  }, []);

  // Persyaratan handler
  const handlePersyaratanChange = (idx, value) => {
    const updated = [...persyaratan];
    updated[idx] = value;
    setPersyaratan(updated);
  };
  const handleAddPersyaratan = () => setPersyaratan([...persyaratan, ""]);
  const handleRemovePersyaratan = (idx) => {
    if (persyaratan.length === 1) return;
    setPersyaratan(persyaratan.filter((_, i) => i !== idx));
  };

  // Dokumen handler
  const handleEditDokumen = (idx) => {
    setEditDocIdx(idx);
    setEditModalOpen(true);
  };

  const handleEditDokumenSubmit = async ({ name, file }) => {
    const doc = dokumen[editDocIdx];
    const formData = new FormData();
    formData.append("name", name);
    formData.append("fileId", doc.fileId);
    if (file) formData.append("file", file);
    setSavingSection('edit-doc');
    try {
      const res = await fetch("/api/akademik/peraturan/dokumen", { method: "PATCH", body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal update dokumen");
      await refreshData();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Dokumen berhasil diperbarui!', iconColor: '#059669', showConfirmButton: false, timer: 1500, confirmButtonColor: '#2563eb' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Terjadi kesalahan', iconColor: '#ef4444', confirmButtonColor: '#2563eb' });
    } finally {
      setSavingSection(null);
    }
  };

  const handleAddDokumenSubmit = async ({ name, file }) => {
    if (!name || !file) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Nama dan file dokumen wajib diisi!",
      });
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);
    setSavingSection('add-doc');
    try {
      const res = await fetch("/api/akademik/peraturan/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAddModalOpen(false);
      await refreshData();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Dokumen berhasil ditambahkan!', iconColor: '#059669', showConfirmButton: false, timer: 1500, confirmButtonColor: '#2563eb' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Terjadi kesalahan', iconColor: '#ef4444', confirmButtonColor: '#2563eb' });
    } finally {
      setSavingSection(null);
    }
  };

  const handleRemoveDokumen = async (idx) => {
    try {
      const doc = dokumen[idx];
      if (!doc?.fileId) {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Dokumen tidak valid atau belum diupload!",
        });
        return;
      }
      const result = await Swal.fire({
        title: `Hapus dokumen?`,
        text: `${doc.dokumenName || "(Tanpa Nama)"}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal",
      });
      if (!result.isConfirmed) return;
      setRemovingIdx(idx);
      const res = await fetch("/api/akademik/peraturan/dokumen", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: doc.fileId }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal hapus dokumen");
      await refreshData();
      Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Dokumen berhasil dihapus!', showConfirmButton: false, timer: 1500, iconColor: '#059669', confirmButtonColor: '#2563eb' });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message || 'Tidak bisa menghapus dokumen!',
        iconColor: '#ef4444',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setRemovingIdx(null);
    }
  };

  // Save handler
  const handleSave = async (section, content) => {
    setSavingSection(section);
    try {
      const res = await fetch(`/api/akademik/peraturan/${section}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: content }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal menyimpan');
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil disimpan!', iconColor: '#059669', showConfirmButton: false, timer: 1400, confirmButtonColor: '#2563eb' });
      fetchData();
      if (section === "ketentuan") setNewKetentuan("");
      if (section === "kebijakan") setNewKebijakan("");
      if (section === "jalur") setNewJalur("");
      if (section === "penetapan") setNewPenetapan("");
      if (section === "persyaratan") setNewPersyaratan([""]);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Gagal menyimpan data!', iconColor: '#ef4444', confirmButtonColor: '#2563eb' });
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-gradient-to-b from-white to-gray-50 min-h-screen w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="admin" />
      <div className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''} flex flex-col`}> 
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userData={{ role: 'admin', nama: 'Admin' }} />
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 flex items-center gap-3"><Info className="w-6 h-6 text-[#2563eb]" />Manajemen Peraturan Akademik</h1>
              <p className="text-sm text-[#6b7280] mt-1">Kelola ketentuan, kebijakan, persyaratan, jalur, penetapan, dan dokumen terkait</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Top add button removed — add is available in Dokumen tab */}
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="overflow-x-auto">
              <nav className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
                {[
                  { id: 'ketentuan', label: 'Ketentuan' },
                  { id: 'kebijakan', label: 'Kebijakan' },
                  { id: 'persyaratan', label: 'Persyaratan' },
                  { id: 'jalur', label: 'Jalur' },
                  { id: 'penetapan', label: 'Penetapan' },
                  { id: 'dokumen', label: 'Dokumen' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-all ${activeTab === t.id ? 'text-[#2563eb]' : 'text-[#6b7280] hover:text-[#2563eb]'}`}
                  >
                    {t.label}
                    <span className={`absolute left-0 right-0 -bottom-px h-1 transition-all ${activeTab === t.id ? 'bg-[#2563eb] rounded-t-full' : 'bg-transparent'}`}></span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-6">
              <Transition
                as={Fragment}
                show={activeTab === 'ketentuan'}
                enter="transition-opacity duration-250"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Info className="w-5 h-5 text-[#2563eb]" /> Ketentuan Umum</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">Informasi ketentuan yang berlaku</p>
                  <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{ketentuan || 'Belum ada data'}</p>
                  </div>
                  <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#2563eb]" value={newKetentuan} onChange={(e) => setNewKetentuan(e.target.value)} placeholder="Masukkan ketentuan baru..." />
                  <div className="flex justify-end mt-4">
                    <button onClick={() => handleSave('ketentuan', newKetentuan)} disabled={savingSection === 'ketentuan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'ketentuan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
                      {savingSection === 'ketentuan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="ml-1">Simpan</span>
                    </button>
                  </div>
                </section>
              </Transition>

              <Transition as={Fragment} show={activeTab === 'kebijakan'} enter="transition-opacity duration-250" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 lg:p-8 transition-all duration-200 transform hover:-translate-y-0">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Info className="w-5 h-5 text-[#2563eb]" /> Kebijakan Seleksi</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">Aturan dan ketentuan seleksi</p>
                  <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{kebijakan || 'Belum ada data'}</p>
                  </div>
                  <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900" value={newKebijakan} onChange={(e) => setNewKebijakan(e.target.value)} placeholder="Masukkan kebijakan baru..." />
                  <div className="flex justify-end mt-4">
                    <button onClick={() => handleSave('kebijakan', newKebijakan)} disabled={savingSection === 'kebijakan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'kebijakan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
                      {savingSection === 'kebijakan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="ml-1">Simpan</span>
                    </button>
                  </div>
                </section>
              </Transition>

              <Transition as={Fragment} show={activeTab === 'persyaratan'} enter="transition-opacity duration-250" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 lg:p-8">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Info className="w-5 h-5 text-[#2563eb]" /> Persyaratan Seleksi</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">Daftar persyaratan peserta</p>
                  <ul className="space-y-3 mt-3">
                    {persyaratan.map((item, idx) => (
                      <li key={idx} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input type="text" className="w-full border border-gray-200 rounded p-2 text-sm" value={item} onChange={(e) => handlePersyaratanChange(idx, e.target.value)} placeholder={`Persyaratan ${idx + 1}`} />
                        </div>
                        <div className="flex items-center gap-2">
                             <Button size="sm" variant="destructive" onClick={() => handleRemovePersyaratan(idx)} disabled={persyaratan.length === 1}>
                                <Trash className="w-4 h-4" /> Hapus
                              </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={handleAddPersyaratan} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#facc15] hover:bg-yellow-400 text-black font-medium"><Plus className="w-4 h-4"/>Tambah</button>
                    <div className="flex-1" />
                    <button onClick={() => handleSave('persyaratan', persyaratan)} disabled={savingSection === 'persyaratan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'persyaratan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
                      {savingSection === 'persyaratan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="ml-1">Simpan</span>
                    </button>
                  </div>
                </section>
              </Transition>

              <Transition as={Fragment} show={activeTab === 'jalur'} enter="transition-opacity duration-250" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 lg:p-8">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Info className="w-5 h-5 text-[#2563eb]" /> Jalur & Alur Seleksi</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">Deskripsi singkat jalur seleksi</p>
                  <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{jalur || 'Belum ada data'}</p>
                  </div>
                  <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900" value={newJalur} onChange={(e) => setNewJalur(e.target.value)} placeholder="Masukkan jalur baru..." />
                  <div className="flex justify-end mt-4">
                    <button onClick={() => handleSave('jalur', newJalur)} disabled={savingSection === 'jalur'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'jalur' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
                      {savingSection === 'jalur' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="ml-1">Simpan</span>
                    </button>
                  </div>
                </section>
              </Transition>

              <Transition as={Fragment} show={activeTab === 'penetapan'} enter="transition-opacity duration-250" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 lg:p-8">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Info className="w-5 h-5 text-[#2563eb]" /> Penetapan Kelulusan</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">Informasi penetapan kelulusan</p>
                  <div className="bg-gray-50 rounded p-3 mt-3 border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{penetapan || 'Belum ada data'}</p>
                  </div>
                  <textarea className="w-full border border-gray-200 rounded mt-3 p-3 text-sm text-gray-900" value={newPenetapan} onChange={(e) => setNewPenetapan(e.target.value)} placeholder="Masukkan penetapan baru..." />
                  <div className="flex justify-end mt-4">
                    <button onClick={() => handleSave('penetapan', newPenetapan)} disabled={savingSection === 'penetapan'} className={`min-h-[40px] px-4 py-2 rounded-lg text-white font-medium inline-flex items-center gap-2 ${savingSection === 'penetapan' ? 'bg-[#1e3a8a] opacity-80' : 'bg-[#2563eb] hover:bg-[#1e40af]'}`}>
                      {savingSection === 'penetapan' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="ml-1">Simpan</span>
                    </button>
                  </div>
                </section>
              </Transition>

              <Transition as={Fragment} show={activeTab === 'dokumen'} enter="transition-opacity duration-250" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><File className="w-5 h-5 text-[#2563eb]" /> Dokumen Terkait</h2>
                    <button onClick={() => setAddModalOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2563eb] hover:bg-[#1e40af] text-white"><UploadCloud className="w-4 h-4"/>Tambah</button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">Daftar dokumen yang dapat diunduh atau diedit</p>

                  {dokumen.length === 0 ? (
                    <p className="text-gray-500 text-sm mt-3">Belum ada dokumen.</p>
                    ) : (
                    <div className="grid grid-cols-1 gap-6 mt-3">
                      {dokumen.map((doc, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:bg-[#f9fafb]">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md bg-gradient-to-b from-[#f0f9ff] to-white text-[#2563eb]">
                                <FileText className="w-6 h-6" />
                              </div>
                                      <div className="min-w-0">
                                        {(doc.fileId || doc.cloudinaryUrl || doc.url) ? (
                                          <a href={getDocViewerUrl(doc)} target="_blank" rel="noreferrer" className="font-semibold text-sm text-[#374151] truncate underline">{doc.dokumenName || '(Tanpa judul)'}</a>
                                        ) : (
                                          <div className="font-semibold text-sm text-[#374151] truncate">{doc.dokumenName || '(Tanpa judul)'}</div>
                                        )}
                                      </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Menu as="div" className="relative inline-block text-left">
                                  <Menu.Button className="p-1 rounded hover:bg-gray-100 focus:outline-none" aria-label={`Menu tindakan untuk ${doc.dokumenName}`}>
                                    <MoreVertical className="w-5 h-5 text-gray-500" />
                                  </Menu.Button>
                                  <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                    <Menu.Items className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-lg shadow-lg focus:outline-none z-50">
                                      <div className="py-1">
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button onClick={() => handleEditDokumen(idx)} className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}>
                                              Edit
                                            </button>
                                          )}
                                        </Menu.Item>
                                        {doc.url && (
                                          <Menu.Item>
                                            {({ active }) => (
                                                <a href={getDocViewerUrl(doc)} target="_blank" rel="noreferrer" className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}>
                                                  {doc.dokumenName || 'Lihat / Unduh'}
                                                </a>
                                              )}
                                          </Menu.Item>
                                        )}
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button onClick={() => handleRemoveDokumen(idx)} disabled={removingIdx === idx} className={`w-full text-left px-4 py-2 text-sm text-red-600 ${active ? 'bg-gray-100' : ''}`}>
                                              Hapus
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-xs text-[#6b7280]">
                              {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'Tanggal tidak tersedia'}
                              {doc.size && <span> • {Math.round(doc.size/1024)} KB</span>}
                            </div>
                            <div className="flex items-center gap-3">
                                {(doc.fileId || doc.cloudinaryUrl || doc.url) && (
                                <Button size="sm" variant="outline" onClick={() => window.open(getDocViewerUrl(doc), '_blank')}>
                                  <Eye className="w-4 h-4" /> Lihat
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => handleEditDokumen(idx)} disabled={savingSection === 'edit-doc' || savingSection === 'add-doc'}>
                                <Pencil className="w-4 h-4" /> Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRemoveDokumen(idx)} disabled={removingIdx === idx}>
                                {removingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />} Hapus
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </Transition>
            </div>
          </div>
        </main>
        <Footer />
        {/* Modal Edit Dokumen */}
        <DokumenModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleEditDokumenSubmit}
          initial={dokumen[editDocIdx]}
        />
        {/* Modal Tambah Dokumen */}
        <DokumenModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleAddDokumenSubmit}
        />
        {/* Sticky mobile action bar */}
        <div className="fixed inset-x-0 bottom-0 sm:hidden z-50">
          <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-xl shadow-md p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-[#2563eb]" />
              <div>
                <div className="text-sm font-semibold">Tambah Dokumen</div>
                <div className="text-xs text-gray-500">Unggah file baru dengan cepat</div>
              </div>
            </div>
            <div>
              <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 rounded-lg bg-[#2563eb] text-white font-medium">Tambah</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}