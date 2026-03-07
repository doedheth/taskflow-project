import { useState, useEffect, useMemo } from 'react';
import AGGridWrapper, { ColDef } from '../components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';
import { assetsAPI } from '../services/api';
import { FailureCode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Search,
} from 'lucide-react';

// Predefined categories for failure codes
const CATEGORIES = [
  { value: 'Electrical', label: 'Electrical', color: 'bg-yellow-500' },
  { value: 'Mechanical', label: 'Mechanical', color: 'bg-blue-500' },
  { value: 'Hydraulic', label: 'Hydraulic', color: 'bg-red-500' },
  { value: 'Pneumatic', label: 'Pneumatic', color: 'bg-cyan-500' },
  { value: 'Process', label: 'Process', color: 'bg-green-500' },
  { value: 'Operator', label: 'Operator', color: 'bg-purple-500' },
  { value: 'Material', label: 'Material', color: 'bg-orange-500' },
  { value: 'Quality', label: 'Quality', color: 'bg-pink-500' },
  { value: 'Other', label: 'Other', color: 'bg-gray-500' },
];

export default function FailureCodes() {
  const { isDark } = useTheme();
  const { isManagerOrAdmin } = useAuth();
  const [failureCodes, setFailureCodes] = useState<FailureCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCode, setEditingCode] = useState<FailureCode | null>(null);
  const [deletingCode, setDeletingCode] = useState<FailureCode | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    code: '',
    category: '',
    description: '',
  });
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    fetchFailureCodes();
  }, []);

  const fetchFailureCodes = async () => {
    try {
      setLoading(true);
      const res = await assetsAPI.getFailureCodes();
      setFailureCodes(res.data);
    } catch (error) {
      console.error('Error fetching failure codes:', error);
      toast.error('Gagal memuat data failure codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (category: string) => {
    setForm({ ...form, category });
    if (!editingCode && category) {
      setGeneratingCode(true);
      try {
        const res = await assetsAPI.generateFailureCode(category);
        setForm(prev => ({ ...prev, category, code: res.data.code }));
      } catch (error) {
        console.error('Error generating code:', error);
      } finally {
        setGeneratingCode(false);
      }
    }
  };

  const openCreateModal = () => {
    setEditingCode(null);
    setForm({ code: '', category: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (fc: FailureCode) => {
    setEditingCode(fc);
    setForm({
      code: fc.code,
      category: fc.category || '',
      description: fc.description,
    });
    setShowModal(true);
  };

  const openDeleteModal = (fc: FailureCode) => {
    setDeletingCode(fc);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description.trim()) {
      toast.error('Kategori dan deskripsi harus diisi');
      return;
    }

    setSaving(true);
    try {
      if (editingCode) {
        await assetsAPI.updateFailureCode(editingCode.id, {
          code: form.code.trim() || undefined,
          category: form.category || undefined,
          description: form.description.trim(),
        });
        toast.success('Failure code berhasil diperbarui');
      } else {
        await assetsAPI.createFailureCode({
          code: form.code.trim() || undefined,
          category: form.category,
          description: form.description.trim(),
        });
        toast.success('Failure code berhasil ditambahkan');
      }
      setShowModal(false);
      fetchFailureCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan failure code');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCode) return;
    setSaving(true);
    try {
      await assetsAPI.deleteFailureCode(deletingCode.id);
      toast.success('Failure code berhasil dihapus');
      setShowDeleteModal(false);
      setDeletingCode(null);
      fetchFailureCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus failure code');
    } finally {
      setSaving(false);
    }
  };

  // Filter data (sorting handled by AG Grid)
  const filteredCodes = failureCodes.filter(fc => {
    const matchSearch = searchTerm === '' ||
      fc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === '' || fc.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryColor = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.color || 'bg-gray-500';
  };

  const columnDefs = useMemo<ColDef<FailureCode>[]>(() => {
    const cols: ColDef<FailureCode>[] = [
      {
        headerName: 'Kode',
        field: 'code',
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<FailureCode>) => {
          if (!params.data) return null;
          return (
            <span className="font-mono font-medium" style={{ color: 'var(--color-text)' }}>
              {params.data.code}
            </span>
          );
        },
      },
      {
        headerName: 'Kategori',
        field: 'category',
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams<FailureCode>) => {
          if (!params.data) return null;
          return (
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--color-surface-elevated)' }}
            >
              <span className={`w-2 h-2 rounded-full ${getCategoryColor(params.data.category || '')}`}></span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{params.data.category || '-'}</span>
            </span>
          );
        },
      },
      {
        headerName: 'Deskripsi',
        field: 'description',
        minWidth: 300,
        flex: 2,
        cellRenderer: (params: ICellRendererParams<FailureCode>) => {
          if (!params.data) return null;
          return (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {params.data.description}
            </span>
          );
        },
      },
    ];

    if (isManagerOrAdmin) {
      cols.push({
        headerName: 'Aksi',
        field: 'id',
        minWidth: 100,
        maxWidth: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<FailureCode>) => {
          if (!params.data) return null;
          const fc = params.data;
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => openEditModal(fc)}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => openDeleteModal(fc)}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      });
    }

    return cols;
  }, [isManagerOrAdmin]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Failure Codes
          </h1>
          <p className={isDark ? 'text-dark-400' : 'text-gray-600'}>
            Kelola kode kegagalan untuk klasifikasi downtime
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
              placeholder="Cari kode atau deskripsi..."
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

      {/* Table */}
      <AGGridWrapper<FailureCode>
        rowData={filteredCodes}
        columnDefs={columnDefs}
        loading={loading}
        height={500}
        emptyMessage={searchTerm || filterCategory ? 'Tidak ada hasil yang cocok' : 'Belum ada failure code'}
      />

      {/* Footer */}
      <div className={`px-4 py-3 rounded-lg border ${isDark ? 'border-dark-700 bg-dark-800 text-dark-400' : 'border-gray-100 bg-white text-gray-500'} text-sm`}>
        Total: {filteredCodes.length} dari {failureCodes.length} data
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className={`relative w-full max-w-md rounded-xl shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingCode ? 'Edit Failure Code' : 'Tambah Failure Code'}
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
                    Kode {!editingCode && <span className="text-xs text-green-500 ml-1">✨ Auto</span>}
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
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Deskripsi kegagalan..."
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border resize-none ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' : 'bg-gray-50 border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    required
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
      {showDeleteModal && deletingCode && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
            <div className={`relative w-full max-w-sm rounded-xl shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Hapus Failure Code?
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-dark-400' : 'text-gray-600'}`}>
                  Hapus <strong>{deletingCode.code}</strong>? Tindakan ini tidak dapat dibatalkan.
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
