import React, { useState } from 'react';
import { X, Factory, Loader2, Save } from 'lucide-react';
import { useCreatePlant } from '@/hooks/useInspection';
import { useTheme } from '@/context/ThemeContext';

interface PlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plant: any) => void;
  initialName?: string;
}

export default function PlantModal({ isOpen, onClose, onSuccess, initialName = '' }: PlantModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const createPlant = useCreatePlant();
  const [formData, setFormData] = useState({ code: '', name: initialName, address: '', contact_person: '', phone: '' });
  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const res = await createPlant.mutateAsync(formData);
    const plant = res?.id ? res : (res?.data || res?.plant);
    if (plant) onSuccess(plant);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl overflow-hidden border ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10"><Factory className="w-5 h-5 text-purple-500"/></div>
            <h3 className={isDark ? 'text-white' : 'text-gray-900'}>Tambah Pabrik Danone</h3>
          </div>
          <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className={`block text-xs mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Kode (otomatis jika kosong)</label>
            <input value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value.toUpperCase()})} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          </div>
          <div>
            <label className={`block text-xs mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Nama <span className="text-red-500">*</span></label>
            <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Kontak</label>
              <input value={formData.contact_person} onChange={e=>setFormData({...formData, contact_person: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`block text-xs mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Telepon</label>
              <input value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
            </div>
          </div>
          <div>
            <label className={`block text-xs mb-1.5 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Alamat</label>
            <textarea value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} rows={2} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className={`${isDark ? 'bg-dark-800 text-white hover:bg-dark-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-4 py-2 rounded-lg text-sm`}>Batal</button>
            <button type="submit" disabled={createPlant.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {createPlant.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              Simpan Pabrik
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
