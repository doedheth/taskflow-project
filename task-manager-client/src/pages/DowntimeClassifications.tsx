import { useState, useEffect, useMemo } from 'react';
import { downtimeAPI } from '../services/api-v2';
import { DowntimeClassification } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AGGridWrapper, { ColDef } from '@/components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Search
} from 'lucide-react';

// Predefined categories for downtime classifications
const CATEGORIES = [
  { value: 'production', label: 'Production', color: 'bg-green-500' },
  { value: 'changeover', label: 'Changeover', color: 'bg-blue-500' },
  { value: 'idle', label: 'Idle', color: 'bg-gray-500' },
  { value: 'breakdown', label: 'Breakdown', color: 'bg-red-500' },
  { value: 'planned_maintenance', label: 'Planned Maintenance', color: 'bg-yellow-500' },
  { value: 'material', label: 'Material', color: 'bg-orange-500' },
  { value: 'quality', label: 'Quality', color: 'bg-purple-500' },
];

export default function DowntimeClassifications() {
  const { isDark } = useTheme();
  const { isManagerOrAdmin } = useAuth();
  const [classifications, setClassifications] = useState<DowntimeClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingClassification, setEditingClassification] = useState<DowntimeClassification | null>(null);
  const [deletingClassification, setDeletingClassification] = useState<DowntimeClassification | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    description: '',
  });
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    fetchClassifications();
  }, []);

  const fetchClassifications = async () => {
    try {
      setLoading(true);
      const res = await downtimeAPI.getClassifications();
      setClassifications(res.data);
    } catch (error) {
      console.error('Error fetching classifications:', error);
      toast.error('Gagal memuat data klasifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (category: string) => {
    setForm({ ...form, category });
    if (!editingClassification && category) {
      setGeneratingCode(true);
      try {
        const res = await downtimeAPI.generateClassificationCode(category);
        setForm(prev => ({ ...prev, category, code: res.data.code }));
      } catch (error) {
        console.error('Error generating code:', error);
      } finally {
        setGeneratingCode(false);
      }
    }
  };

  const openCreateModal = () => {
    setEditingClassification(null);
    setForm({ code: '', name: '', category: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (c: DowntimeClassification) => {
    setEditingClassification(c);
    setForm({
      code: c.code,
      name: c.name,
      category: c.category,
      description: c.description || '',
    });
    setShowModal(true);
  };

  const openDeleteModal = (c: DowntimeClassification) => {
    setDeletingClassification(c);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.category) {
      toast.error('Kode, nama, dan kategori wajib diisi');
      return;
    }

    setSaving(true);
    try {
      if (editingClassification) {
        await downtimeAPI.updateClassification(editingClassification.id, form);
        toast.success('Klasifikasi berhasil diperbarui');
      } else {
        await downtimeAPI.createClassification(form);
        toast.success('Klasifikasi berhasil ditambahkan');
      }
      setShowModal(false);
      fetchClassifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClassification) return;
    setSaving(true);
    try {
      await downtimeAPI.deleteClassification(deletingClassification.id);
      toast.success('Klasifikasi berhasil dihapus');
      setShowDeleteModal(false);
      setDeletingClassification(null);
      fetchClassifications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus');
    } finally {
      setSaving(false);
    }
  };

  // Filter classifications
  const filteredClassifications = classifications.filter(c => {
    const matchSearch = searchTerm === '' ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = filterCategory === '' || c.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryInfo = (categoryValue: string) => {
    return CATEGORIES.find(c => c.value === categoryValue) || { label: categoryValue, color: 'bg-gray-500' };
  };

  // AG Grid column definitions with flex proportions
  const columnDefs = useMemo<ColDef<DowntimeClassification>[]>(() => {
    const cols: ColDef<DowntimeClassification>[] = [
      {
        headerName: 'Kode',
        field: 'code',
        flex: 1,
        minWidth: 100,
        cellRenderer: (params: ICellRendererParams<DowntimeClassification>) => {
          if (!params.data) return null;
          return (
            <span className="font-mono font-medium" style={{ color: 'var(--color-text)' }}>
              {params.data.code}
            </span>
          );
        },
      },
      {
        headerName: 'Nama',
        field: 'name',
        flex: 2,
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams<DowntimeClassification>) => {
          if (!params.data) return null;
          return (
            <span className="font-medium truncate" style={{ color: 'var(--color-text)' }} title={params.data.name}>
              {params.data.name}
            </span>
          );
        },
      },
      {
        headerName: 'Kategori',
        field: 'category',
        flex: 1,
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<DowntimeClassification>) => {
          if (!params.data) return null;
          const catInfo = getCategoryInfo(params.data.category);
          return (
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
              isDark ? 'bg-dark-700' : 'bg-gray-100'
            }`}>
              <span className={`w-2 h-2 rounded-full ${catInfo.color}`}></span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{catInfo.label}</span>
            </span>
          );
        },
      },
      {
        headerName: 'Deskripsi',
        field: 'description',
        flex: 3,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<DowntimeClassification>) => {
          if (!params.data) return null;
          return (
            <span className="truncate" style={{ color: 'var(--color-text-secondary)' }} title={params.data.description || '-'}>
              {params.data.description || '-'}
            </span>
          );
        },
      },
    ];

    if (isManagerOrAdmin) {
      cols.push({
        headerName: 'Aksi',
        field: 'id',
        flex: 0.6,
        minWidth: 80,
        maxWidth: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<DowntimeClassification>) => {
          if (!params.data) return null;
          const c = params.data;
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => openEditModal(c)}
                className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded"
                title="Edit"
              >
                <Pencil className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <button
                onClick={() => openDeleteModal(c)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          );
        },
      });
    }

    return cols;
  }, [isManagerOrAdmin, isDark]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Klasifikasi Downtime
          </h1>
          <p className={isDark ? 'text-dark-400' : 'text-gray-600'}>
            Kelola klasifikasi downtime untuk produksi
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Cari kode atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark 
                ? 'bg-dark-700 border-dark-600 text-white' 
                : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* AG Grid Table */}
      <AGGridWrapper<DowntimeClassification>
        rowData={filteredClassifications}
        columnDefs={columnDefs}
        loading={loading}
        height={500}
        emptyMessage={searchTerm || filterCategory ? 'Tidak ada hasil yang cocok' : 'Belum ada klasifikasi'}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className={`relative w-full max-w-md rounded-xl shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingClassification ? 'Edit Klasifikasi' : 'Tambah Klasifikasi'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Kode {!editingClassification && <span className="text-xs text-green-500 ml-1">✨ Auto</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="Pilih kategori untuk generate"
                      disabled={generatingCode}
                      className={`w-full px-4 py-2 rounded-lg border font-mono ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' : 'bg-gray-50 border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      required
                    />
                    {generatingCode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Machine Breakdown"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Deskripsi
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Deskripsi klasifikasi..."
                    rows={2}
                    className={`w-full px-4 py-2 rounded-lg border resize-none ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>
                <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingClassification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
            <div className={`relative w-full max-w-sm rounded-xl shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Hapus Klasifikasi?
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
                  Hapus <strong>{deletingClassification.code}</strong> - {deletingClassification.name}? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
