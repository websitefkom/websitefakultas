"use client"
import { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/app/components/Dashboard/Sidebar'
import Navbar from '@/app/components/Dashboard/Navbar'
import Footer from '@/app/components/Dashboard/Footer'
import Swal from 'sweetalert2'
import { FiUser, FiEdit2, FiTrash2, FiSearch, FiPlus } from 'react-icons/fi'
import { Button } from '@/components/ui/button'

export default function ManajemenPengguna() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'sekretaris', password: '' })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json.data || [])
      setUsers(list)
    } catch (err) {
      console.error('fetchUsers error', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', role: 'sekretaris', password: '' }); setModalOpen(true) }

  const handleCreate = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Gagal membuat pengguna')
      await fetchUsers()
      setModalOpen(false)
      setForm({ name: '', email: '', role: 'sekretaris', password: '' })
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengguna dibuat.' })
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Gagal membuat pengguna' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditInit = (u) => { setEditing(u); setForm({ name: u.name||'', email: u.email||'', role: u.role||'sekretaris', password: '' }); setModalOpen(true) }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editing) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/users/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Gagal memperbarui pengguna')
      setEditing(null)
      setModalOpen(false)
      setForm({ name: '', email: '', role: 'sekretaris', password: '' })
      await fetchUsers()
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengguna diperbarui.' })
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Gagal memperbarui pengguna' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmRes = await Swal.fire({ title: 'Hapus pengguna?', text: 'Tindakan ini tidak dapat dibatalkan.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' })
    if (!confirmRes.isConfirmed) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus pengguna')
      await fetchUsers()
      Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Pengguna berhasil dihapus.' })
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message || 'Gagal menghapus pengguna' })
    }
  }

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q))
  }, [users, searchQuery])

  const roleBadge = (role) => {
    const map = {
      super_admin: 'bg-purple-100 text-purple-800',
      dekan: 'bg-blue-100 text-blue-800',
      ketua_dept: 'bg-indigo-100 text-indigo-800',
      kepala_dept: 'bg-indigo-100 text-indigo-800',
      sekretaris: 'bg-emerald-100 text-emerald-800',
    }
    const label = {
      super_admin: 'Super Admin',
      dekan: 'Dekan',
      ketua_dept: 'Ketua Dept',
      kepala_dept: 'Kepala Dept',
      sekretaris: 'Sekretaris',
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${map[role] || 'bg-slate-100 text-slate-800'}`}>
        {label[role] || role}
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="admin" />

        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''} flex flex-col`}>
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userData={{ role: 'admin', nama: 'Admin' }} />

          <div className="pt-16 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
                  <p className="text-sm text-slate-500">Kelola akun pengguna dan hak akses.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama atau email..."
                      className="pl-10 pr-4 py-2 border rounded-lg shadow-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                  <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow transition">
                    <FiPlus /> Tambah User
                  </button>
                </div>
              </div>

              <div className="mb-4 text-sm text-slate-600">Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> pengguna</div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <span className="text-sm font-medium">Daftar Pengguna</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left">Pengguna</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Role</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="p-8 text-center">
                          <div className="inline-flex items-center gap-3">
                            <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            <span>Memuat pengguna...</span>
                          </div>
                        </td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={4} className="p-6 text-center text-slate-500">Belum ada pengguna yang cocok</td></tr>
                      ) : filteredUsers.map(u => (
                        <tr key={u._id} className="border-t hover:bg-slate-50 transition-colors">
                          <td className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <FiUser />
                            </div>
                            <div>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-xs text-slate-500">{u._id}</div>
                            </div>
                          </td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3">{roleBadge(u.role)}</td>
                          <td className="p-3 text-center">
                            <div className="inline-flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditInit(u)}>
                                <FiEdit2 className="w-4 h-4" /> Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(u._id)}>
                                <FiTrash2 className="w-4 h-4" /> Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          <footer className="mt-auto bg-white">
            <Footer />
          </footer>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!isSaving) { setModalOpen(false); setEditing(null) } }} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editing ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>
                <button onClick={() => { if (!isSaving) { setModalOpen(false); setEditing(null) } }} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Nama</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Email</label>
                  <input name="email" value={form.email} onChange={handleChange} type="email" required className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Role</label>
                    <select name="role" value={form.role} onChange={handleChange} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200">
                      <option value="super_admin">Super Admin</option>
                      <option value="dekan">Dekan</option>
                      <option value="ketua_dept">Ketua Dept</option>
                      <option value="kepala_dept">Kepala Dept</option>
                      <option value="sekretaris">Sekretaris</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Password {editing ? <span className="text-xs text-slate-400">(kosongkan jika tidak diubah)</span> : ''}</label>
                    <input name="password" value={form.password} onChange={handleChange} type="password" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setModalOpen(false); setEditing(null); setForm({ name:'', email:'', role:'sekretaris', password:'' }) }} disabled={isSaving} className="px-4 py-2 bg-gray-100 rounded">Batal</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded inline-flex items-center gap-2">
                    {isSaving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Buat Pengguna')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
