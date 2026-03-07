/**
 * Supplier Modal Component
 *
 * A modal form to create a new supplier inline.
 */

import React, { useState } from 'react';
import { X, Building2, Loader2, Save } from 'lucide-react';
import { useCreateSupplier } from '@/hooks/useInspection';
import { useTheme } from '@/context/ThemeContext';
import toast from 'react-hot-toast';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplier: any) => void;
  initialName?: string;
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
}: SupplierModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const createSupplier = useCreateSupplier();

  const [formData, setFormData] = useState({
    code: '',
    name: initialName,
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama supplier harus diisi');
      return;
    }

    try {
      const result = await createSupplier.mutateAsync(formData);
      console.log('Supplier creation result:', result);

      // The server returns the raw supplier object on success
      // Or sometimes wrapped in { success: true, data: ... }
      // Or { success: true, supplier: ... }
      const supplierData = result?.id ? result : (result?.data || result?.supplier);

      // Determine success:
      // 1. result is the raw object with an id
      // 2. result is a wrapped response with success: true
      // 3. result is a wrapped response and we extracted supplierData with an id
      const isActuallySuccess = !!(supplierData?.id || result?.success === true);

      if (isActuallySuccess) {
        toast.success('Supplier berhasil ditambahkan');
        onSuccess(supplierData || result);
        onClose();
      } else {
        const errorMsg = result?.message || result?.error || 'Gagal menambahkan supplier: Struktur respons tidak dikenal atau data ID hilang';
        toast.error(errorMsg);
        console.warn('Supplier creation failed check:', { result, supplierData, isActuallySuccess });
      }
    } catch (error: any) {
      console.error('Supplier creation catch error:', error);
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
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Tambah Supplier Baru [v1.1]
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Kode Supplier <span className="text-gray-400 italic font-normal">(otomatis jika kosong)</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark
                    ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="CONTOH: SUP001"
              />
            </div>
            <div className="col-span-1">
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Nama Supplier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark
                    ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="Nama Perusahaan"
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Kontak Person
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                isDark
                  ? 'bg-dark-800 border-dark-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Nama PIC"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Telepon
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark
                    ? 'bg-dark-800 border-dark-700 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="0812..."
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark
                    ? 'bg-dark-800 border-dark-700 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="supplier@mail.com"
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Alamat
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                isDark
                  ? 'bg-dark-800 border-dark-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Alamat lengkap supplier..."
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
              disabled={createSupplier.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {createSupplier.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
