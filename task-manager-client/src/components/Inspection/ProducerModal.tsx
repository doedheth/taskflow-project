/**
 * Producer Modal Component
 *
 * A modal form to create a new producer inline.
 */

import React, { useState } from 'react';
import { X, Factory, Loader2, Save } from 'lucide-react';
import { useCreateProducer } from '@/hooks/useInspection';
import { useTheme } from '@/context/ThemeContext';
import toast from 'react-hot-toast';

interface ProducerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (producer: any) => void;
  initialName?: string;
}

export default function ProducerModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
}: ProducerModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const createProducer = useCreateProducer();

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
      toast.error('Nama produsen harus diisi');
      return;
    }

    try {
      const result = await createProducer.mutateAsync(formData);

      const producerData = result?.id ? result : (result?.data || result?.producer);
      const isActuallySuccess = !!(producerData?.id || result?.success === true);

      if (isActuallySuccess) {
        toast.success('Produsen berhasil ditambahkan');
        onSuccess(producerData || result);
        onClose();
      } else {
        const errorMsg = result?.message || result?.error || 'Gagal menambahkan produsen';
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
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Factory className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Tambah Produsen Baru
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
                Kode Produsen <span className="text-gray-400 italic font-normal">(otomatis jika kosong)</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  isDark
                    ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="PROD001"
              />
            </div>
            <div className="col-span-1">
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Nama Produsen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  isDark
                    ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="Nama Produsen"
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
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
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
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
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
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  isDark
                    ? 'bg-dark-800 border-dark-700 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="producer@mail.com"
              />
            </div>
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
              disabled={createProducer.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {createProducer.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Produsen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
