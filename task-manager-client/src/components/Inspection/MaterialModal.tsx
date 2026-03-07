/**
 * Material Modal Component
 *
 * A modal form to create a new material inline.
 */

import React, { useState } from 'react';
import { X, Package, Loader2, Save } from 'lucide-react';
import { useCreateMaterial } from '@/hooks/useInspection';
import { useTheme } from '@/context/ThemeContext';
import toast from 'react-hot-toast';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (material: any) => void;
  initialName?: string;
}

export default function MaterialModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
}: MaterialModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const createMaterial = useCreateMaterial();

  const [formData, setFormData] = useState({
    code: '',
    name: initialName,
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama material harus diisi');
      return;
    }

    try {
      const result = await createMaterial.mutateAsync(formData);

      const materialData = result?.id ? result : (result?.data || result?.material);
      const isActuallySuccess = !!(materialData?.id || result?.success === true);

      if (isActuallySuccess) {
        toast.success('Material berhasil ditambahkan');
        onSuccess(materialData || result);
        onClose();
      } else {
        const errorMsg = result?.message || result?.error || 'Gagal menambahkan material';
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Terjadi kesalahan saat menghubungi server';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${
        isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-dark-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Tambah Material Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Kode Material <span className="text-gray-400 italic font-normal">(otomatis jika kosong)</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                isDark
                  ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="MAT-001"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Nama Material <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                isDark
                  ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Nama Material"
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                isDark
                  ? 'bg-dark-800 border-dark-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Keterangan material..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-dark-800 text-white hover:bg-dark-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMaterial.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {createMaterial.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Material
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
