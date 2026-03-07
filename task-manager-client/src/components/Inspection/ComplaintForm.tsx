import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCreateComplaint, useUpdateComplaint, useComplaint } from '@/hooks/useComplaint';
import { Complaint, ComplaintStatus } from '@/types/complaint';
import { Loader2, Save, FileText, Maximize2, X, FileSignature, Trash2, Plus } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';
import { useInspection } from '@/hooks/useInspection';
import RichTextEditor from '@/components/RichTextEditor';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { uploadAPI } from '@/services/api';
import { compressImage } from '@/utils/imageCompression';

interface ComplaintFormProps {
  inspectionId: number;
  complaintId?: number;
  onSuccess?: () => void;
  readOnly?: boolean;
}

type SigType = 'qcIncoming' | 'spvQaqc' | 'ppic';

export const ComplaintForm: React.FC<ComplaintFormProps> = ({ inspectionId, complaintId, onSuccess, readOnly }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<Partial<Complaint>>({
    inspection_id: inspectionId,
    status: 'pending',
    photos: [],
  });

  const [qcIncomingName, setQcIncomingName] = useState<string>('');
  const [spvQaqcName, setSpvQaqcName] = useState<string>('');
  const [ppicName, setPpicName] = useState<string>('');
  const [supplierPersonName, setSupplierPersonName] = useState<string>('');

  const qcIncomingSigRef = useRef<SignatureCanvas>(null);
  const spvQaqcSigRef = useRef<SignatureCanvas>(null);
  const ppicSigRef = useRef<SignatureCanvas>(null);
  const modalSigRef = useRef<SignatureCanvas>(null);
  const [maximizedSig, setMaximizedSig] = useState<SigType | null>(null);

  const createComplaint = useCreateComplaint();
  const updateComplaint = useUpdateComplaint();
  const { data: inspection } = useInspection(inspectionId, { enabled: !!inspectionId });
  const { data: existingComplaint } = useComplaint(complaintId || 0, !!complaintId);

  // Sync data when editing existing complaint
  useEffect(() => {
    if (existingComplaint) {
      setForm(existingComplaint);
      setQcIncomingName(existingComplaint.qc_incoming_name || '');
      setSpvQaqcName(existingComplaint.spv_qaqc_name || '');
      setPpicName(existingComplaint.ppic_name || '');
      setSupplierPersonName(existingComplaint.supplier_person_name || '');

      // Load signatures into pads
      const timer = setTimeout(() => {
        if (existingComplaint.qaqc_signature_url && qcIncomingSigRef.current)
          qcIncomingSigRef.current.fromDataURL(existingComplaint.qaqc_signature_url);
        if (existingComplaint.spv_qaqc_signature_url && spvQaqcSigRef.current)
          spvQaqcSigRef.current.fromDataURL(existingComplaint.spv_qaqc_signature_url);
        if (existingComplaint.ppic_signature_url && ppicSigRef.current)
          ppicSigRef.current.fromDataURL(existingComplaint.ppic_signature_url);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [existingComplaint]);

  // Sync basic data from inspection for new complaint
  useEffect(() => {
    if (inspection && !complaintId) {
      setForm(prev => ({
        ...prev,
        item_name: prev.item_name || inspection.material_name || inspection.item_name || '',
        tanggal_datang: prev.tanggal_datang || inspection.inspection_date || '',
        unit: prev.unit || inspection.measure_unit || inspection.packaging_unit || '',
        attn: prev.attn || inspection.supplier_name || '',
        po_no: prev.po_no || inspection.po_no || '',
        surat_jalan_ref: prev.surat_jalan_ref || inspection.surat_jalan_no || '',
      }));
      if (!qcIncomingName) setQcIncomingName(user?.name || '');
    }
  }, [inspection, complaintId, user]);

  const batches = useMemo(() => inspection?.items?.filter((i: any) => i.batch_no) || [], [inspection]);

  const handlePhotoUpload = async (file: File) => {
    try {
      toast.loading('Mengunggah foto...', { id: 'upload' });
      const compressedFile = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
      const res = await uploadAPI.uploadImage(compressedFile);
      const url = res.data.url;
      setForm(prev => ({ ...prev, photos: [...(prev.photos || []), { photo_url: url, description: '' }] }));
      toast.success('Foto diunggah', { id: 'upload' });
    } catch (err) {
      toast.error('Gagal mengunggah foto', { id: 'upload' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keteranganText = (form.keterangan || '').replace(/<[^>]*>/g, '').trim();
    if (!form.attn || !form.item_name || !form.qty || !keteranganText) {
      toast.error('Mohon lengkapi field wajib');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        inspection_id: inspectionId,
        qaqc_signature_url: qcIncomingSigRef.current?.isEmpty() ? null : qcIncomingSigRef.current?.toDataURL(),
        spv_qaqc_signature_url: spvQaqcSigRef.current?.isEmpty() ? null : spvQaqcSigRef.current?.toDataURL(),
        ppic_signature_url: ppicSigRef.current?.isEmpty() ? null : ppicSigRef.current?.toDataURL(),
        qc_incoming_name: qcIncomingName,
        spv_qaqc_name: spvQaqcName,
        ppic_name: ppicName,
        supplier_person_name: supplierPersonName,
      };

      if (complaintId) {
        await updateComplaint.mutateAsync({ id: complaintId, ...payload });
        toast.success('Komplain diperbarui');
      } else {
        await createComplaint.mutateAsync(payload);
        toast.success('Komplain disimpan');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const getSigRef = (t: SigType) => t === 'qcIncoming' ? qcIncomingSigRef : t === 'spvQaqc' ? spvQaqcSigRef : ppicSigRef;
  const getSigLabel = (t: SigType) => t === 'qcIncoming' ? 'QC Incoming' : t === 'spvQaqc' ? 'SPV QAQC' : 'PPIC';

  const signatureItems = [
    { type: 'qcIncoming' as SigType, label: 'QC Incoming', number: 1, nameValue: qcIncomingName, onNameChange: setQcIncomingName },
    { type: 'spvQaqc' as SigType, label: 'SPV QAQC', number: 2, nameValue: spvQaqcName, onNameChange: setSpvQaqcName },
    { type: 'ppic' as SigType, label: 'PPIC', number: 3, nameValue: ppicName, onNameChange: setPpicName },
  ];

  const saveMaximized = () => {
    if (!maximizedSig || !modalSigRef.current) return;
    const targetRef = getSigRef(maximizedSig);
    if (targetRef.current) {
      targetRef.current.clear();
      if (!modalSigRef.current.isEmpty()) {
        targetRef.current.fromDataURL(modalSigRef.current.toDataURL());
      }
    }
    setMaximizedSig(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Attn / Kepada <span className="text-red-500">*</span></label>
            <input value={form.attn || ''} onChange={e => setForm({...form, attn: e.target.value})} className="input h-12" required disabled={readOnly} placeholder="Nama supplier/penerima..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Nama Barang <span className="text-red-500">*</span></label>
            <input value={form.item_name || ''} onChange={e => setForm({...form, item_name: e.target.value})} className="input h-12" required disabled={readOnly} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">No. Batch</label>
            <select value={(form as any).batch_no || ''} onChange={e => setForm({...form, batch_no: e.target.value})} className="input h-12" disabled={readOnly}>
              <option value="">— Umum / Tanpa Batch —</option>
              {batches.map((b: any, idx: number) => (<option key={idx} value={b.batch_no}>{b.batch_no} (Qty: {b.qty})</option>))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Tanggal Datang</label>
            <input type="date" value={form.tanggal_datang || ''} onChange={e => setForm({...form, tanggal_datang: e.target.value})} className="input h-12" disabled={readOnly} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Qty <span className="text-red-500">*</span></label>
              <input type="number" value={form.qty || ''} onChange={e => setForm({...form, qty: Number(e.target.value)})} className="input h-12" required disabled={readOnly} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Satuan</label>
              <input value={form.unit || ''} readOnly className="input h-12 bg-gray-50/50 dark:bg-dark-900/30" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Keterangan Ketidaksesuaian <span className="text-red-500">*</span></label>
          <RichTextEditor value={form.keterangan || ''} onChange={val => setForm({...form, keterangan: val})} isDark={theme === 'dark'} readOnly={readOnly} minHeight="150px" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">Foto Bukti Ketidaksesuaian</h4>
            {!readOnly && (
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
                <Plus className="w-3.5 h-3.5" /> Tambah Foto
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(f => handlePhotoUpload(f)); e.target.value = ''; }} />
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {form.photos?.map((p, idx) => (
              <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-surface shadow-sm">
                <img src={p.photo_url.startsWith('http') ? p.photo_url : `${window.location.origin}${p.photo_url}`} alt="" className="w-full h-full object-cover" />
                {!readOnly && <button type="button" onClick={() => setForm({...form, photos: form.photos?.filter((_, i) => i !== idx)})} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Trash2 className="w-3.5 h-3.5" /></button>}
                <div className="absolute bottom-0 inset-x-0 p-2 bg-black/60 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <input value={p.description || ''} onChange={e => {
                    const newPhotos = [...(form.photos || [])];
                    newPhotos[idx] = { ...newPhotos[idx], description: e.target.value };
                    setForm({...form, photos: newPhotos});
                  }} placeholder="Ket..." className="w-full text-[10px] bg-transparent text-white outline-none border-b border-white/30" disabled={readOnly} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-8">
          {signatureItems.map(({ type, label, number, nameValue, onNameChange }, i) => (
            <div key={type} className="space-y-3 text-center">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{number}. {label}</label>
                {!readOnly && <button type="button" onClick={() => setMaximizedSig(type)} className="text-primary hover:scale-110 transition-transform"><Maximize2 className="w-3.5 h-3.5" /></button>}
              </div>
              <div className={`border border-border rounded-2xl bg-white h-28 relative shadow-inner ${readOnly ? 'pointer-events-none' : 'cursor-crosshair'}`}>
                <SignatureCanvas ref={getSigRef(type)} penColor="black" canvasProps={{ className: 'w-full h-full' }} />
              </div>
              <input value={nameValue}
                onChange={e => onNameChange(e.target.value)}
                className="w-full text-center text-xs font-bold p-2 border-b border-border bg-transparent outline-none focus:border-primary"
                placeholder="Nama Lengkap..." disabled={readOnly} />
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button type="button" onClick={() => onSuccess?.()} className="btn h-12 px-8 bg-gray-100 text-gray-700 font-black tracking-widest rounded-xl hover:bg-gray-200">BATAL</button>
            <button type="submit" disabled={loading} className="btn h-12 px-10 btn-primary flex items-center gap-2 rounded-xl shadow-xl shadow-primary/20 font-black tracking-widest">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} SIMPAN DATA
            </button>
          </div>
        )}
      </form>

      {maximizedSig && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-surface-elevated rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border border-white/10">
            <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50 dark:bg-dark-900">
              <h3 className="font-black uppercase tracking-tighter text-xl">Tanda Tangan: {getSigLabel(maximizedSig)}</h3>
              <button onClick={() => setMaximizedSig(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 h-[50vh] bg-white">
              <SignatureCanvas ref={modalSigRef} penColor="black" canvasProps={{ className: 'w-full h-full' }} />
            </div>
            <div className="p-8 border-t border-border flex justify-center gap-4 bg-gray-50 dark:bg-dark-900">
              <button onClick={() => modalSigRef.current?.clear()} className="px-8 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50">RESET</button>
              <button onClick={saveMaximized} className="px-12 py-3 rounded-xl bg-primary text-white font-black tracking-widest shadow-xl shadow-primary/20">TERAPKAN</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
