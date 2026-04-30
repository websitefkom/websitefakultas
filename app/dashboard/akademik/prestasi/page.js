"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Dashboard/Sidebar';
import Navbar from '@/app/components/Dashboard/Navbar';
import Footer from '@/app/components/Dashboard/Footer';
import { Edit, Trash2, Plus, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { z } from 'zod';
import Image from 'next/image';
import { useRoleGuard } from "@/hooks/useRoleGuard";
import UnauthorizedBlock from "@/app/components/UnauthorizedBlock";

const MySwal = withReactContent(Swal);


export default function PrestasiAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Mahasiswa');
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
   // ✅ Editor & Super Admin boleh akses halaman ini
  const { hasAccess, isLoading, session } = useRoleGuard(['super_admin', 'editor']);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'confirm'
  const [modalData, setModalData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = data.filter((d) => {
    if (!d) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchQ = String(d.judul || '').toLowerCase().includes(q) || String(d.identitas?.nama || '').toLowerCase().includes(q);
    if (activeTab === 'Fakultas/Prodi') {
      const k = (d.kategori || '').toString().toLowerCase();
      const role = (d.raw?.role || '').toString().toLowerCase();
      if (k === 'fakultas' || k === 'prodi' || role === 'fakultas' || role === 'prodi' || (d.kategori || '') === 'Fakultas/Prodi') {
        return matchQ;
      }
      return false;
    }
    return d.kategori === activeTab && matchQ;
  });

  // normalize role value for API: prefer explicit 'prodi' or 'fakultas' when provided
  const normalizeRole = (r) => {
    if (!r) return 'mahasiswa';
    const s = r.toString().toLowerCase();
    if (s.includes('prodi')) return 'prodi';
    if (s.includes('fakultas')) return 'fakultas';
    if (s.includes('dosen')) return 'dosen';
    return 'mahasiswa';
  }

  // Zod schema for client-side validation (optional)
  const FormSchema = z.object({
    judul: z.string().min(1, 'Judul wajib diisi'),
    tingkat: z.enum(['Nasional', 'Universitas', 'Internasional', 'Provinsi']),
    tanggal: z.string().min(1, 'Tanggal wajib diisi'),
    deskripsi: z.string().optional(),
    identitas: z.object({
      nim: z.string().optional(),
      nama: z.string().optional(),
      program_studi: z.string().optional(),
    }).optional(),
    bukti: z.object({ url_sertifikat: z.string().optional(), url_foto: z.string().optional() }).optional(),
  });

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/prestasi');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Fetch failed');
      // map to UI-friendly shape
      const mapped = json.data.map((doc) => ({
        id: doc._id,
        tahun: doc.prestasi?.tanggal ? new Date(doc.prestasi.tanggal).getFullYear() : '',
        kategori: (doc.role || '').toString().toLowerCase() === 'dosen' ? 'Dosen' : ((doc.role || '').toString().toLowerCase() === 'prodi' ? 'Prodi' : ((doc.role || '').toString().toLowerCase() === 'fakultas' ? 'Fakultas' : 'Mahasiswa')),
        judul: doc.prestasi?.judul || '',
        deskripsi: doc.prestasi?.penyelenggara || '',
        identitas: doc.identitas || {},
        bukti: doc.bukti || {},
        raw: doc,
      }));
      setAllData(mapped);
      setData(mapped);
    } catch (err) {
      console.error(err);
      MySwal.fire({ icon: 'error', title: 'Error', text: err.message || 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Modal handlers
  const openAddModal = () => {
    setModalMode('add');
    setModalData({ judul: '', tingkat: 'Nasional', tanggal: '', deskripsi: '', identitas: {}, bukti: {} });
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode('edit');
    const raw = row.raw || {};
    setModalData({
      _id: row.id,
      judul: raw.prestasi?.judul || row.judul,
      tingkat: raw.prestasi?.tingkat || 'Nasional',
      tanggal: raw.prestasi?.tanggal || '',
      deskripsi: raw.prestasi?.penyelenggara || row.deskripsi,
      identitas: raw.identitas || {},
      bukti: raw.bukti || {},
    });
    setModalOpen(true);
  };

  const openDeleteConfirm = (row) => {
    setModalMode('confirm');
    setModalData({ id: row.id, judul: row.judul });
    setModalOpen(true);
  };

  // Perform actions
  const performAdd = async (values) => {
    try {
      setActionLoading(true);
      // If files are present, use FormData and let the server handle uploads
      let res;
      console.log('performEdit: resolvedId=', values._id, 'hasFiles=', !!(values.buktiFileFoto || values.buktiFileSertifikat));
      if (values.buktiFileFoto || values.buktiFileSertifikat) {
        const fd = new FormData();
        const roleToSend = normalizeRole(values.role || values.unitType || activeTab);
        fd.append('role', roleToSend);
        fd.append('judul', values.judul || '');
        fd.append('tingkat', values.tingkat || 'Nasional');
        fd.append('tanggal', values.tanggal || '');
        fd.append('penyelenggara', values.deskripsi || '');
        // identitas fields
        fd.append('identitas_nim', values.identitas?.nim || '');
        fd.append('identitas_nama', values.identitas?.nama || '');
        fd.append('identitas_program_studi', values.identitas?.program_studi || '');
        // append files if present
        if (values.buktiFileSertifikat) fd.append('bukti_sertifikat', values.buktiFileSertifikat);
        if (values.buktiFileFoto) fd.append('bukti_foto', values.buktiFileFoto);

        // If there are existing (non-blob) URLs in the form (e.g., editing or pasted URLs), include them as fallback
        if (values.bukti?.url_sertifikat && !values.bukti?.url_sertifikat.startsWith('blob:')) {
          fd.append('bukti_url_sertifikat', values.bukti.url_sertifikat);
        }
        if (values.bukti?.url_foto && !values.bukti?.url_foto.startsWith('blob:')) {
          fd.append('bukti_url_foto', values.bukti.url_foto);
        }

        res = await fetch('/api/prestasi', { method: 'POST', body: fd });
      } else {
        // Prevent sending temporary blob: URLs in JSON payloads — ask user to re-select files
        if ((values.bukti?.url_foto && values.bukti.url_foto.startsWith('blob:')) || (values.bukti?.url_sertifikat && values.bukti.url_sertifikat.startsWith('blob:'))) {
          MySwal.fire({ icon: 'warning', title: 'Silakan unggah file', text: 'Terdapat preview sementara (blob URL). Silakan pilih ulang file bukti sebelum mengirim.' });
          return;
        }

        const payload = {
          role: normalizeRole(values.role || values.unitType || activeTab),
          identitas: values.identitas,
          prestasi: { judul: values.judul, tingkat: values.tingkat, tanggal: values.tanggal, penyelenggara: values.deskripsi },
          bukti: values.bukti,
        };
        res = await fetch('/api/prestasi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Create failed');
      MySwal.fire({ icon: 'success', title: 'Berhasil', text: 'Prestasi berhasil ditambahkan.' });
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      MySwal.fire({ icon: 'error', title: 'Error', text: err.message || 'Gagal menambah data' });
    } finally {
      setActionLoading(false);
    }
  };

const performEdit = async (values) => {
    try {
      setActionLoading(true);
      
      // 1. Pastikan ID ditemukan
      const resolvedId = values?._id || values?.id || (modalData && (modalData._id || modalData.id));
      
      if (!resolvedId) {
        console.error('performEdit: missing _id in payload', values);
        MySwal.fire({ icon: 'error', title: 'Error', text: 'ID tidak ditemukan. Silakan refresh halaman.' });
        setActionLoading(false);
        return;
      }
      
      // 2. Normalisasi ID
      values._id = resolvedId;

      // 3. Gunakan endpoint body-based (server expects _id in body or form)
      const endpoint = `/api/prestasi`;
      
      let res;
      if (values.buktiFileFoto || values.buktiFileSertifikat) {
        const fd = new FormData();
        // ID tetap dimasukkan ke Body untuk jaga-jaga
        fd.append('_id', values._id);
        const roleToSend = normalizeRole(values.role || values.unitType || activeTab);
        fd.append('role', roleToSend);
        fd.append('judul', values.judul || '');
        fd.append('tingkat', values.tingkat || 'Nasional');
        fd.append('tanggal', values.tanggal || '');
        fd.append('penyelenggara', values.deskripsi || '');
        fd.append('identitas_nim', values.identitas?.nim || '');
        fd.append('identitas_nama', values.identitas?.nama || '');
        fd.append('identitas_program_studi', values.identitas?.program_studi || '');
        
        if (values.buktiFileSertifikat) fd.append('bukti_sertifikat', values.buktiFileSertifikat);
        if (values.buktiFileFoto) fd.append('bukti_foto', values.buktiFileFoto);

        // Fallback URL lama
        if (values.bukti?.url_sertifikat && !values.bukti?.url_sertifikat.startsWith('blob:')) {
          fd.append('bukti_url_sertifikat', values.bukti.url_sertifikat);
        }
        if (values.bukti?.url_foto && !values.bukti?.url_foto.startsWith('blob:')) {
          fd.append('bukti_url_foto', values.bukti.url_foto);
        }

        // Send multipart FormData to server; _id already appended
        res = await fetch(endpoint, { method: 'PUT', body: fd });
      } else {
        if ((values.bukti?.url_foto && values.bukti.url_foto.startsWith('blob:')) || (values.bukti?.url_sertifikat && values.bukti.url_sertifikat.startsWith('blob:'))) {
          MySwal.fire({ icon: 'warning', title: 'Silakan unggah file', text: 'Terdapat preview sementara (blob URL). Silakan pilih ulang file bukti sebelum mengirim.' });
          return;
        }

        const payload = {
          _id: values._id,
          role: normalizeRole(values.role || values.unitType || activeTab),
          identitas: values.identitas,
          prestasi: { judul: values.judul, tingkat: values.tingkat, tanggal: values.tanggal, penyelenggara: values.deskripsi },
          bukti: values.bukti,
        };
        
        // Send JSON payload with _id in body
        res = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Update failed');
      
      MySwal.fire({ icon: 'success', title: 'Tersimpan', text: 'Perubahan berhasil disimpan.' });
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      MySwal.fire({ icon: 'error', title: 'Error', text: err.message || 'Gagal menyimpan perubahan' });
    } finally {
      setActionLoading(false);
    }
  };

  const performDelete = async (id) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/prestasi?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Delete failed');
      MySwal.fire({ icon: 'success', title: 'Berhasil', text: 'Prestasi dihapus.' });
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      MySwal.fire({ icon: 'error', title: 'Error', text: err.message || 'Gagal menghapus data' });
    } finally {
      setActionLoading(false);
    }
  };
 if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={session?.user?.role} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : ""} flex flex-col`}>
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="w-full max-w-7xl mx-auto px-4 pt-20 pb-24 flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </main>
          <Footer />
        </div>
      </div>
    );
  }
  
    return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={session?.user?.role} />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : ""} flex flex-col`}>
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
 
        <main className="w-full max-w-7xl mx-auto px-4 pt-20 pb-24 flex-1">
          {!hasAccess ? (
            <UnauthorizedBlock />
          ) : (
            <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Prestasi</h1>
            <div className="space-x-2">
              <div className="inline-flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" />
                  <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Cari judul atau nama..." className="pl-10 pr-3 py-2 rounded-md border border-gray-200 text-sm w-64" />
                </div>
                <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600">
                  <Plus className="w-4 h-4" /> Tambah Prestasi
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <nav className="inline-flex rounded-md bg-white shadow-sm p-1">
              {['Mahasiswa', 'Dosen', 'Fakultas/Prodi'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === t ? 'bg-[#1E3A8A] text-white' : 'text-slate-700'}`}
                >
                  {t}
                </button>
              ))}
            </nav>
            {/* Mobile: dropdown */}
            <div className="md:hidden">
              <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="border rounded px-3 py-2">
                <option>Mahasiswa</option>
                <option>Dosen</option>
                <option>Fakultas/Prodi</option>
              </select>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestasi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identitas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bukti</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                      // skeleton rows
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                          <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-20" /></td>
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                          <div className="mx-auto max-w-xs">
                            <svg className="mx-auto mb-4 w-24 h-24 text-gray-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/><path d="M7 14l3-3 2 2 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/></svg>
                            <div className="font-semibold text-gray-700">Tidak ditemukan data</div>
                            <p className="text-sm text-gray-500 mt-2">Coba ubah kata kunci pencarian atau tambahkan data baru.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence initial={false}>
                        {filtered.map((row) => (
                          <motion.tr key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }} className="hover:bg-blue-50 transition-all">
                            <td className="px-6 py-4 align-top max-w-[36rem]">
                              <div className="font-semibold text-gray-900 truncate">{row.judul}</div>
                              <div className="mt-1">
                                <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${row.judul && row.judul.toLowerCase().includes('internasional') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{row.judul && row.judul.toLowerCase().includes('internasional') ? 'Internasional' : 'Nasional'}</span>
                                <div className="text-sm text-gray-500 mt-2">{row.deskripsi}</div>
                              </div>
                            </td>

                            <td className="px-6 py-4 align-top">
                              <div className="font-semibold text-gray-900">{row.identitas?.nama || '-'}</div>
                              <div className="text-xs text-gray-500">{row.identitas?.nim || row.identitas?.nidn || '-'}</div>
                            </td>

                            <td className="px-6 py-4 align-top text-sm text-gray-700">{row.tahun}</td>

                            <td className="px-6 py-4 align-top text-sm text-gray-600">
                              <div className="flex items-center gap-3">
                                {row.bukti?.url_foto ? (
                                  <a href={row.bukti.url_foto} target="_blank" rel="noreferrer" className="w-20 h-12 block overflow-hidden rounded">
                                    <Image src={row.bukti.url_foto} alt="bukti" width={160} height={96} unoptimized className="object-cover w-full h-full" />
                                  </a>
                                ) : <span className="text-xs text-gray-400 italic">-</span>}
                                {row.bukti?.url_sertifikat ? (
                                  <a href={row.bukti.url_sertifikat} target="_blank" rel="noreferrer" className="text-xs text-blue-700 font-medium underline">Sertifikat</a>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEditModal(row)} title="Edit Data" className="p-2 rounded-md text-[#1E3A8A] hover:bg-blue-50">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => openDeleteConfirm(row)} title="Hapus Data" className="p-2 rounded-md text-red-600 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
            </>
          )}
        </main>
        {/* Modal instance */}
        <PrestasiModal
          open={modalOpen}
          mode={modalMode}
          role={activeTab}
          data={modalData}
          onClose={() => setModalOpen(false)}
          loading={actionLoading}
          onSubmit={async (payload) => {
            // build dynamic schema based on role
            const getSchemaForRole = (role) => {
              const r = (role || '').toString().toLowerCase();
              const base = z.object({
                judul: z.string().min(1, 'Judul wajib diisi'),
                tingkat: z.enum(['Nasional', 'Universitas', 'Internasional', 'Provinsi']),
                tanggal: z.string().min(1, 'Tanggal wajib diisi'),
                deskripsi: z.string().optional(),
                bukti: z.object({ url_sertifikat: z.string().optional(), url_foto: z.string().optional() }).optional(),
              });

              if (r.includes('mahasiswa')) {
                return base.extend({ identitas: z.object({ nim: z.string().min(1, 'NIM wajib diisi').regex(/^[0-9]+$/, 'NIM harus berupa angka'), nama: z.string().min(1, 'Nama wajib diisi'), program_studi: z.string().optional() }).optional() });
              }

              // Fakultas/Prodi: require a unit name (stored in identitas.nama) and optional unit type
              if (r.includes('prodi') || r.includes('fakultas')) {
                return base.extend({ identitas: z.object({ nama: z.string().min(1, 'Nama Prodi/Fakultas wajib diisi'), unit_type: z.enum(['prodi', 'fakultas']).optional(), program_studi: z.string().optional() }).optional() });
              }

              // Dosen (fallback)
              return base.extend({ identitas: z.object({ nidn: z.string().min(1, 'NIDN wajib diisi').regex(/^[0-9]+$/, 'NIDN harus berupa angka'), nama: z.string().min(1, 'Nama wajib diisi'), fakultas_jabatan: z.string().optional() }).optional() });
            };

            if (modalMode === 'add') {
              const schema = getSchemaForRole(activeTab);
              const parsed = schema.safeParse(payload);
              if (!parsed.success) {
                const messages = parsed.error?.errors?.map((e) => e.message).join('\n') || String(parsed.error) || 'Validasi gagal';
                MySwal.fire({ icon: 'warning', title: 'Validasi', text: messages });
                return;
              }
              // preserve file fields and auxiliary unit fields from the original payload
              const toSend = {
                ...parsed.data,
                buktiFileFoto: payload.buktiFileFoto,
                buktiFileSertifikat: payload.buktiFileSertifikat,
                unitType: payload.unitType,
                unitName: payload.unitName,
                _id: payload._id,
                // prefer parsed bukti if present, otherwise use original (may contain preview URLs)
                bukti: parsed.data.bukti || payload.bukti,
              };
              await performAdd(toSend);
            } else if (modalMode === 'edit') {
              const schema = getSchemaForRole(activeTab);
              const parsed = schema.safeParse(payload);
              if (!parsed.success) {
                const messages = parsed.error?.errors?.map((e) => e.message).join('\n') || String(parsed.error) || 'Validasi gagal';
                MySwal.fire({ icon: 'warning', title: 'Validasi', text: messages });
                return;
              }
              await performEdit(payload);
            } else if (modalMode === 'confirm') {
              await performDelete(payload.id);
            }
          }}
        />

        <Footer className="mt-auto" />
      </div>
    </div>
  );
}

// Modal component rendered at the end of file (client-side only)
function PrestasiModal({ open, mode, role, data, onClose, onSubmit, loading }) {
  const [form, setForm] = React.useState(data || { judul: '', tingkat: 'Nasional', tanggal: '', deskripsi: '', identitas: {}, bukti: {} });
  const [previewFoto, setPreviewFoto] = React.useState(null);
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    setForm(data || { judul: '', tingkat: 'Nasional', tanggal: '', deskripsi: '', identitas: {}, bukti: {} });
    setPreviewFoto(data?.bukti?.url_foto || null);
    setErrors({});
  }, [data]);

  React.useEffect(() => {
    if (!role) return;
    setForm((s) => {
      const id = s.identitas || {};
      if (role === 'Mahasiswa') {
        const nim = id.nim || id.nidn || '';
        return { ...s, identitas: { nim, nama: id.nama || '', program_studi: id.program_studi || '' } };
      }
      if (role === 'Fakultas/Prodi') {
        // initialize unit fields; use identitas.nama as unit name if present
        const unitName = id.nama || s.unitName || '';
        const unitType = s.unitType || 'prodi';
        return { ...s, unitType, unitName, identitas: { nama: unitName } };
      }
      const nidn = id.nidn || id.nim || '';
      return { ...s, identitas: { nidn, nama: id.nama || '', fakultas_jabatan: id.fakultas_jabatan || '' } };
    });
  }, [role]);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const setIdent = (k, v) => setForm((s) => ({ ...s, identitas: { ...(s.identitas || {}), [k]: v } }));

  // drag & drop handlers
  const handleDrop = async (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreviewFoto(url);
    setForm((s) => ({ ...s, buktiFileFoto: f, buktiNameFoto: f.name }));
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreviewFoto(url);
    setForm((s) => ({ ...s, buktiFileFoto: f, buktiNameFoto: f.name }));
  };

  const validate = () => {
    const zBase = z.object({
      judul: z.string().min(1, 'Judul wajib diisi'),
      tingkat: z.string(),
      tanggal: z.string().min(1, 'Tanggal wajib diisi'),
    });
    try {
      zBase.parse({ judul: form.judul, tingkat: form.tingkat, tanggal: form.tanggal });
      setErrors({});
      return true;
    } catch (err) {
      const errObj = {};
      err.errors?.forEach((e) => { errObj[e.path[0]] = e.message; });
      setErrors(errObj);
      return false;
    }
  };

  const submit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.18 }} className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-3">{mode === 'add' ? 'Tambah Prestasi' : mode === 'edit' ? 'Edit Prestasi' : 'Konfirmasi'}</h3>

            {(mode === 'add' || mode === 'edit') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Judul</label>
                    <input value={form.judul} onChange={(e)=>setField('judul', e.target.value)} placeholder="Judul prestasi" className="w-full border rounded px-3 py-2 mt-1" />
                    <p className="text-xs text-gray-500 mt-1">Gunakan kata kunci &apos;Juara 1&apos;, &apos;Gold&apos;, atau &apos;Emas&apos; agar muncul Badge spesial di halaman publik.</p>
                    {errors.judul && <div className="text-xs text-red-600 mt-1">{errors.judul}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Tingkat</label>
                      <select value={form.tingkat} onChange={(e)=>setField('tingkat', e.target.value)} className="w-full border rounded px-3 py-2 mt-1">
                        <option>Nasional</option>
                        <option>Universitas</option>
                        <option>Internasional</option>
                        <option>Provinsi</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tanggal</label>
                      <input type="date" value={form.tanggal || ''} onChange={(e)=>setField('tanggal', e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
                      {errors.tanggal && <div className="text-xs text-red-600 mt-1">{errors.tanggal}</div>}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Deskripsi / Penyelenggara</label>
                    <textarea value={form.deskripsi} onChange={(e)=>setField('deskripsi', e.target.value)} placeholder="Deskripsi" className="w-full border rounded px-3 py-2 h-28 mt-1" />
                  </div>

                  <div className="pt-2 border-t">
                    <h4 className="font-semibold">Identitas</h4>
                    <p className="text-xs text-slate-500 mt-1">Isi sesuai dengan peran: {role}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                        {role === 'Mahasiswa' ? (
                        <>
                          <input inputMode="numeric" value={form.identitas?.nim || ''} onChange={(e)=>setIdent('nim', e.target.value.replace(/\D/g,''))} placeholder="NIM" className="border rounded px-3 py-2" />
                          <input value={form.identitas?.nama || ''} onChange={(e)=>setIdent('nama', e.target.value)} placeholder="Nama" className="border rounded px-3 py-2" />
                          <input value={form.identitas?.program_studi || ''} onChange={(e)=>setIdent('program_studi', e.target.value)} placeholder="Program Studi" className="border rounded px-3 py-2" />
                        </>
                        ) : role === 'Fakultas/Prodi' ? (
                          <>
                            <select value={form.unitType || 'prodi'} onChange={(e)=>{ setField('unitType', e.target.value); setIdent('unit_type', e.target.value); }} className="border rounded px-3 py-2">
                              <option value="prodi">Prodi</option>
                              <option value="fakultas">Fakultas</option>
                            </select>
                            <input value={form.unitName || form.identitas?.nama || ''} onChange={(e)=>{ setField('unitName', e.target.value); setIdent('nama', e.target.value); }} placeholder="Nama Prodi / Fakultas" className="border rounded px-3 py-2" />
                            <input value={form.identitas?.program_studi || ''} onChange={(e)=>setIdent('program_studi', e.target.value)} placeholder="Kode / Keterangan (opsional)" className="border rounded px-3 py-2" />
                          </>
                        ) : (
                          <>
                            <input inputMode="numeric" value={form.identitas?.nidn || ''} onChange={(e)=>setIdent('nidn', e.target.value.replace(/\D/g,''))} placeholder="NIDN" className="border rounded px-3 py-2" />
                            <input value={form.identitas?.nama || ''} onChange={(e)=>setIdent('nama', e.target.value)} placeholder="Nama" className="border rounded px-3 py-2" />
                            <input value={form.identitas?.fakultas_jabatan || ''} onChange={(e)=>setIdent('fakultas_jabatan', e.target.value)} placeholder="Fakultas / Jabatan" className="border rounded px-3 py-2" />
                          </>
                        )}
                    </div>
                  </div>
                </div>

                {/* Upload Zone */}
                <div>
                  <label className="text-sm font-medium">Evidence Upload Zone</label>
                  <div onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop} className="mt-2 border-2 border-dashed border-gray-200 rounded-lg p-4 h-64 flex flex-col items-center justify-center text-center cursor-pointer">
                    <div className="text-gray-500">
                      <div className="mb-3 text-sm">Tarik & lepaskan foto bukti atau klik untuk memilih</div>
                      <div className="text-xs text-gray-400 mb-3">PNG / JPG — disarankan 1200x800 untuk tampilan terbaik</div>
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="evidence-file-input" />
                      <label htmlFor="evidence-file-input" className="inline-flex items-center px-3 py-2 bg-[#1E3A8A] text-white rounded">Pilih File</label>
                    </div>
                    {previewFoto && (
                      <div className="mt-3 w-full h-36 rounded overflow-hidden border">
                        <Image src={previewFoto} alt="preview" width={1200} height={800} unoptimized className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-gray-500">Preview hanya untuk admin; URL yang tersimpan berasal dari upload server atau input URL saat editing.</div>
                </div>
              </div>
            )}

            {mode === 'confirm' && (
              <div className="py-4">Apakah Anda yakin ingin menghapus prestasi: <strong>{data?.judul}</strong>?</div>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Batal</button>
              {(mode === 'add' || mode === 'edit') && (
                <button onClick={submit} disabled={loading} className="px-4 py-2 rounded bg-[#1E3A8A] text-white hover:bg-[#16306f]">
                  {loading ? 'Menyimpan...' : mode === 'add' ? 'Tambah' : 'Simpan'}
                </button>
              )}
              {mode === 'confirm' && (
                <button onClick={() => onSubmit(data)} disabled={loading} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500">{loading ? 'Menghapus...' : 'Ya, Hapus'}</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

