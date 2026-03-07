/**
 * Inspection Form Page
 *
 * Multi-step form for Incoming Material Inspection
 */

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  Truck,
  Package,
  ShieldCheck,
  Scale,
  FileSignature,
  Camera,
  Trash2,
  Maximize2,
  X,
  FileText,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';

import logoHeader from '@/images/lgo-header.png';
import { useAuth } from '@/context/AuthContext';
import { useCreateInspection, useUpdateInspection, useInspection } from '@/hooks/useInspection';
import { uploadAPI } from '@/services/api';
import SupplierPicker from '@/components/Inspection/SupplierPicker';
import PlantPicker from '@/components/Inspection/PlantPicker';
import ProducerPicker from '@/components/Inspection/ProducerPicker';
import MaterialPicker from '@/components/Inspection/MaterialPicker'; // Added
import { Supplier, Producer, Material, CreateInspectionDTO, InspectionItem, InspectionWeight, InspectionQCParams } from '@/types/inspection';
import { compressImage } from '@/utils/imageCompression';

type FormStep = 'vehicle' | 'packaging' | 'qc' | 'weight' | 'documents' | 'signature';

export default function InspectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = !!id;
  const inspectionId = id ? parseInt(id) : null;

  // Queries & Mutations
  const { data: existingData, isLoading: isLoadingExisting } = useInspection(inspectionId as number, {
    enabled: isEdit
  });
  const createMutation = useCreateInspection();
  const updateMutation = useUpdateInspection();

  // Navigation state
  const [currentStep, setCurrentStep] = useState<FormStep>('vehicle');
  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);

  // Form state
  const initialQCParams = {
    q_berat: 0,
    q_joint: 0,
    q_creasing: 0,
    q_coa_panjang: 0,
    q_coa_lebar: 0,
    q_coa_tinggi: 0,
    q_coa_tebal: 0,
    q_coa_bct: 0,
    q_coa_cobb: 0,
    q_coa_bursting: 0,
    q_coa_batch_lot: 0,
    q_coa_color_chip: 0,
    q_visual_sobek: 0,
    q_visual_cetakan: 0,
    q_visual_flutting: 0,
    q_visual_packaging: 0,
    q_visual_warna: 0,
    q_visual_clarity: 0,
    fs_mat_bersih: 0,
    fs_mat_bau: 0,
    fs_veh_bersih: 0,
    fs_veh_bau: 0,
    fs_veh_bak: 0,
    fs_veh_segel: 0,
    qc_score: 0,
    fs_score: 0,
    decision: 'Di terima'
  };

  const [formData, setFormData] = useState<Partial<CreateInspectionDTO>>({
    inspection_date: format(new Date(), 'yyyy-MM-dd'),
    arrival_time: format(new Date(), 'HH:mm'),
    status: 'pending',
    vehicle_clean: 1,
    vehicle_no_odor: 1,
    vehicle_closed: 1,
    vehicle_on_time: 1,
    vehicle_on_time_delivery: 1,
    item_not_wet: 1,
    item_not_torn: 1,
    item_not_dusty: 1,
    item_closed_tight: 1,
    item_no_haram: 1,
    pkg_good: 1,
    pkg_label_ok: 1,
    total_items_received_text: '',
    packaging_notes: '',
    nama_produsen: '',
    negara_produsen: '',
    pabrik_danone: '',
    kode_produksi: '',
    logo_halal: 'Ada',
    expedition_name: '',
    vehicle_no: '',
    vehicle_type: 'Fuso',
    vehicle_cover_type: 'Box',
    driver_name: '',
    driver_phone: '',
    material_type: 'Resin',
    warna: 'Sesuai Standar',
    jumlah_sampling: '6 Pcs',
    tanggal_produksi: '',
    packaging_unit: 'ZAK',
    measure_unit: 'KG',
    items: Array.from({ length: 20 }, () => ({
      batch_no: '',
      expired_date: '',
      palet_no: '',
      qty: 0,
      weight_per_unit: 0,
      is_ok: 1,
      notes: ''
    })),
    weights: Array.from({ length: 6 }, () => ({ batch_no: '', weight: 0, photo_url: '' })),
    attachments: [], // Added
    qc_params: initialQCParams as any,
    surat_jalan_photo_url: '',
    ttb_photo_url: '',
    coa_photo_url: ''
  });

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<any | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null); // Added
  const [maximizedSig, setMaximizedSig] = useState<'driver' | 'checker' | 'warehouse' | 'supervisor' | null>(null);
  const [packagingUnits, setPackagingUnits] = useState<string[]>([
    'ZAK', 'BOX', 'IKAT', 'PALET', 'DRUM', 'KALENG', 'ROLL', 'BALL', 'JERIGEN', 'PAIL', 'JUMBO BAG'
  ]);
  const [newPackagingUnit, setNewPackagingUnit] = useState<string>('');

  useEffect(() => {
    if (formData.packaging_unit) {
      const up = (formData.packaging_unit || '').toString().toUpperCase();
      if (up && !packagingUnits.includes(up)) {
        setPackagingUnits(prev => [...prev, up]);
      }
    }
  }, [formData.packaging_unit]);

  const openMaximize = (type: 'driver' | 'checker' | 'warehouse' | 'supervisor') => {
    setMaximizedSig(type);
    // Sync current signature to modal after it renders
    setTimeout(() => {
      if (modalSigRef.current) {
        let sourceRef;
        if (type === 'driver') sourceRef = driverSigRef;
        else if (type === 'checker') sourceRef = checkerSigRef;
        else if (type === 'warehouse') sourceRef = warehouseSigRef;
        else sourceRef = supervisorSigRef;

        if (sourceRef.current && !sourceRef.current.isEmpty()) {
          modalSigRef.current.fromDataURL(sourceRef.current.toDataURL());
        }
      }
    }, 100);
  };

  const saveMaximized = () => {
    if (!maximizedSig || !modalSigRef.current) return;

    let targetRef;
    if (maximizedSig === 'driver') targetRef = driverSigRef;
    else if (maximizedSig === 'checker') targetRef = checkerSigRef;
    else if (maximizedSig === 'warehouse') targetRef = warehouseSigRef;
    else targetRef = supervisorSigRef;

    if (targetRef.current) {
      targetRef.current.clear();
      if (!modalSigRef.current.isEmpty()) {
        targetRef.current.fromDataURL(modalSigRef.current.toDataURL());
      }
    }
    setMaximizedSig(null);
  };

  // Refs for signatures
  const checkerSigRef = useRef<SignatureCanvas>(null);
  const driverSigRef = useRef<SignatureCanvas>(null);
  const warehouseSigRef = useRef<SignatureCanvas>(null);
  const supervisorSigRef = useRef<SignatureCanvas>(null);
  const modalSigRef = useRef<SignatureCanvas>(null);

  // Populate data when in edit mode
  useEffect(() => {
    if (isEdit && existingData) {
      const data = { ...existingData };

      // Ensure objects are initialized to prevent undefined access
      const currentItems = data.items || [];
      const paddedItems = [...currentItems];
      while (paddedItems.length < 20) {
        paddedItems.push({ batch_no: '', expired_date: '', palet_no: '', qty: 0, weight_per_unit: 0, is_ok: 1, notes: '' });
      }

      const currentWeights = data.weights || [];
      const paddedWeights = [...currentWeights];
      while (paddedWeights.length < 6) {
        paddedWeights.push({ batch_no: '', weight: 0, photo_url: '' });
      }

      // Merge and ensure all top-level fields have values
      setFormData({
        inspection_no: data.inspection_no || '',
        inspection_date: data.inspection_date || format(new Date(), 'yyyy-MM-dd'),
        arrival_time: data.arrival_time || '',
        supplier_id: data.supplier_id,
        producer_id: data.producer_id,
        material_id: data.material_id, // Added
        po_no: data.po_no || '',
        surat_jalan_no: data.surat_jalan_no || '',
        pabrik_danone: data.pabrik_danone || '',
        kode_produksi: data.kode_produksi || '',
        nama_produsen: data.nama_produsen || '',
        negara_produsen: data.negara_produsen || '',
        logo_halal: data.logo_halal || 'Ada',
        expedition_name: data.expedition_name || '',
        vehicle_no: data.vehicle_no || '',
        vehicle_type: data.vehicle_type || 'Fuso',
        vehicle_cover_type: data.vehicle_cover_type || 'Box',
        driver_name: data.driver_name || '',
        driver_phone: data.driver_phone || '',
        expired_date: data.expired_date || '',
        no_seal: data.no_seal || '',
        unloading_start_time: data.unloading_start_time || '',
        unloading_end_time: data.unloading_end_time || '',
        total_items_received: data.total_items_received,
        total_items_received_text: data.total_items_received_text || '',
        checker_id: data.checker_id,
        status: data.status || 'pending',
        notes: data.notes || '',
        packaging_notes: data.packaging_notes || '',
        vehicle_clean: data.vehicle_clean ?? 1,
        vehicle_no_odor: data.vehicle_no_odor ?? 1,
        vehicle_closed: data.vehicle_closed ?? 1,
        vehicle_on_time: data.vehicle_on_time ?? 1,
        vehicle_on_time_delivery: data.vehicle_on_time_delivery ?? 1,
        item_not_wet: data.item_not_wet ?? 1,
        item_not_torn: data.item_not_torn ?? 1,
        item_not_dusty: data.item_not_dusty ?? 1,
        item_closed_tight: data.item_closed_tight ?? 1,
        item_no_haram: data.item_no_haram ?? 1,
        pkg_condition: data.pkg_condition || 'BAIK',
        pkg_name_check: data.pkg_name_check || 'ADA',
        pkg_hazard_label: data.pkg_hazard_label || 'TIDAK PERLU',
        pkg_good: data.pkg_good ?? 1,
        pkg_label_ok: data.pkg_label_ok ?? 1,
        material_type: data.material_type || 'Resin',
        warna: data.warna || 'Sesuai Standar',
        jumlah_sampling: data.jumlah_sampling || '6 Pcs',
        tanggal_produksi: data.tanggal_produksi || '',
        items: paddedItems,
        weights: paddedWeights,
        qc_params: data.qc_params || initialQCParams as any,
        surat_jalan_photo_url: data.surat_jalan_photo_url || '',
        ttb_photo_url: data.ttb_photo_url || '',
        coa_photo_url: data.coa_photo_url || '',
        attachments: data.attachments || [],
        checker_signature: data.checker_signature,
        driver_signature: data.driver_signature,
        warehouse_signature: data.warehouse_signature,
        supervisor_signature: data.supervisor_signature
      });

      // Handle supplier Picker
      if (data.supplier_id) {
        setSelectedSupplier({
          id: data.supplier_id,
          name: (data as any).supplier_name || '',
          code: (data as any).supplier_code || ''
        } as Supplier);
      }

      // Handle producer Picker
      if (data.producer_id) {
        setSelectedProducer({
          id: data.producer_id,
          name: (data as any).producer_name || '',
          code: (data as any).producer_code || ''
        } as Producer);
      }

      // Handle material Picker
      if (data.material_id) {
        setSelectedMaterial({
          id: data.material_id,
          name: (data as any).material_name || '',
          code: (data as any).material_code || ''
        } as Material);
      }

      setCompletedSteps(['vehicle', 'packaging', 'qc', 'weight']);
    }
  }, [isEdit, existingData]);

  // Handle attachment upload
  const handleAttachmentUpload = async (file: File) => {
    try {
      toast.loading('Mengkompresi dan mengunggah lampiran...', { id: 'upload' });

      // Compress image dengan kualitas tinggi untuk print
      const compressedFile = await compressImage(file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.92,
        mimeType: 'image/jpeg'
      });

      const res = await uploadAPI.uploadImage(compressedFile);
      const url = res.data.url || `/uploads/${res.data.filename}`;

      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), { photo_url: url, description: '' }]
      }));

      toast.success('Lampiran berhasil diunggah', { id: 'upload' });
    } catch (error) {
      toast.error('Gagal mengunggah lampiran', { id: 'upload' });
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index)
    }));
  };

  // Update attachment description
  const updateAttachmentDescription = (index: number, description: string) => {
    setFormData(prev => {
      const newAttachments = [...(prev.attachments || [])];
      if (newAttachments[index]) {
        newAttachments[index] = { ...newAttachments[index], description };
      }
      return { ...prev, attachments: newAttachments };
    });
  };

  // Handle existing signatures in canvas
  useEffect(() => {
    if (isEdit && existingData && currentStep === 'signature') {
      // Small delay to ensure canvas is rendered
      setTimeout(() => {
        if (existingData.driver_signature && driverSigRef.current) {
          driverSigRef.current.fromDataURL(existingData.driver_signature);
        }
        if (existingData.checker_signature && checkerSigRef.current) {
          checkerSigRef.current.fromDataURL(existingData.checker_signature);
        }
        if (existingData.warehouse_signature && warehouseSigRef.current) {
          warehouseSigRef.current.fromDataURL(existingData.warehouse_signature);
        }
        if (existingData.supervisor_signature && supervisorSigRef.current) {
          supervisorSigRef.current.fromDataURL(existingData.supervisor_signature);
        }
      }, 100);
    }
  }, [currentStep, isEdit, existingData]);

  // Auto-fill from localStorage if exists (only for new mode)
  useEffect(() => {
    if (!isEdit) {
      const saved = localStorage.getItem(`inspection_draft_${user?.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }, [user?.id, isEdit]);

  // Save draft periodically (only for new mode)
  useEffect(() => {
    if (!isEdit) {
      const draft = { ...formData };
      delete draft.checker_signature;
      delete draft.driver_signature;
      delete draft.warehouse_signature;
      delete draft.supervisor_signature;
      localStorage.setItem(`inspection_draft_${user?.id}`, JSON.stringify(draft));
    }
  }, [formData, user?.id, isEdit]);

  // Loading state should be AFTER all hooks are declared
  if (isEdit && isLoadingExisting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const updateFormData = (fields: Partial<CreateInspectionDTO>) => {
    setFormData(prev => {
      const newData = { ...prev, ...fields };

      // Auto-update pkg_good and pkg_label_ok based on string selections
      if (fields.pkg_condition) {
        newData.pkg_good = fields.pkg_condition === 'BAIK' ? 1 : 0;
      }
      if (fields.pkg_name_check) {
        newData.pkg_label_ok = fields.pkg_name_check === 'ADA' ? 1 : 0;
      }

      return newData;
    });
  };

  const updateQCParam = (field: keyof Omit<InspectionQCParams, 'id' | 'inspection_id'>, value: any) => {
    setFormData(prev => {
      const newQCParams = {
        ...(prev.qc_params || {}),
        [field]: value
      } as InspectionQCParams;

      return {
        ...prev,
        qc_params: newQCParams
      };
    });
  };

  // Step validation
  const validateStep = (step: FormStep): boolean => {
    if (step === 'vehicle') {
      if (!selectedSupplier) {
        toast.error('Supplier harus dipilih');
        return false;
      }
      if (!formData.vehicle_no) {
        toast.error('No. Kendaraan harus diisi');
        return false;
      }
    }
    return true;
  };

  const nextStep = (target: FormStep) => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(target);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = (target: FormStep) => {
    setCurrentStep(target);
    window.scrollTo(0, 0);
  };

  const updateQCItem = (index: number, field: keyof Omit<InspectionItem, 'id' | 'inspection_id'>, value: any) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value } as Omit<InspectionItem, 'id' | 'inspection_id'>;

      // Auto-calculate total received if qty or is_ok changed
      const totalReceived = newItems.reduce((acc, item) => {
        if (item.is_ok === 1) {
          const qty = Number(item.qty) || 0;
          const weight = Number(item.weight_per_unit) || 0;
          return acc + (qty * weight);
        }
        return acc;
      }, 0);

      return {
        ...prev,
        items: newItems,
        total_items_received: totalReceived
      };
    });
  };

  const updateWeight = (index: number, field: keyof Omit<InspectionWeight, 'id' | 'inspection_id'>, value: any) => {
    setFormData(prev => {
      const newWeights = [...(prev.weights || [])];
      newWeights[index] = { ...newWeights[index], [field]: value } as Omit<InspectionWeight, 'id' | 'inspection_id'>;
      return { ...prev, weights: newWeights };
    });
  };

  const handleFileUpload = async (index: number | string, file: File) => {
    try {
      toast.loading('Mengkompresi dan mengunggah foto...', { id: 'upload' });

      // Compress image dengan kualitas tinggi untuk print
      const compressedFile = await compressImage(file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.92,
        mimeType: 'image/jpeg'
      });

      const res = await uploadAPI.uploadImage(compressedFile);
      const url = res.data.url || `/uploads/${res.data.filename}`;

      if (typeof index === 'number') {
        updateWeight(index, 'photo_url', url);
      } else {
        updateFormData({ [index]: url });
      }

      toast.success('Foto berhasil diunggah', { id: 'upload' });
    } catch (error) {
      toast.error('Gagal mengunggah foto', { id: 'upload' });
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    // 1. Validasi Dasar (Wajib untuk draft maupun complete)
    if (!selectedSupplier) {
      toast.error('Supplier harus dipilih');
      setCurrentStep('vehicle');
      return;
    }

    if (!formData.vehicle_no) {
      toast.error('No. Kendaraan harus diisi');
      setCurrentStep('vehicle');
      return;
    }

    // 2. Validasi Ketat (Hanya jika ingin Complete)
    if (!isDraft) {
      // Skor dan foto timbangan sekarang optional (bisa lanjut jika kosong) sesuai request user
      /*
      const qcScore = formData.qc_params?.qc_score || 0;
      const fsScore = formData.qc_params?.fs_score || 0;

      if (qcScore === 0 || fsScore === 0) {
        toast.error('Score Kualitas dan Score Keamanan harus diisi manual (tidak boleh 0%) untuk menyelesaikan laporan');
        setCurrentStep('qc');
        return;
      }

      const hasPhoto = formData.weights?.some(w => w.photo_url && w.photo_url.trim() !== '');
      if (!hasPhoto) {
        toast.error('Minimal harus mengunggah 1 foto timbangan sebagai bukti untuk menyelesaikan laporan');
        setCurrentStep('weight');
        return;
      }
      */

      // Validasi Tanda Tangan tetap dipertahankan untuk Complete
      const needsSignatures = !isEdit || (isEdit && (!formData.checker_signature || !formData.driver_signature || !formData.warehouse_signature));
      if (needsSignatures) {
        const isCheckerEmpty = checkerSigRef.current?.isEmpty();
        const isDriverEmpty = driverSigRef.current?.isEmpty();
        const isWarehouseEmpty = warehouseSigRef.current?.isEmpty();

        if (isCheckerEmpty || isDriverEmpty || isWarehouseEmpty) {
          toast.error('Tanda tangan Sopir, Checker, dan Gudang wajib diisi untuk menyelesaikan laporan');
          setCurrentStep('signature');
          return;
        }
      }
    }

    try {
      const checkerSig = checkerSigRef.current?.isEmpty() ? formData.checker_signature : checkerSigRef.current?.toDataURL();
      const driverSig = driverSigRef.current?.isEmpty() ? formData.driver_signature : driverSigRef.current?.toDataURL();
      const warehouseSig = warehouseSigRef.current?.isEmpty() ? formData.warehouse_signature : warehouseSigRef.current?.toDataURL();
      const supervisorSig = supervisorSigRef.current?.isEmpty() ? formData.supervisor_signature : supervisorSigRef.current?.toDataURL();

      // Filter out empty items and weights
      const filteredItems = (formData.items || []).filter(item => item.batch_no || (item.qty && item.qty > 0));
      const filteredWeights = (formData.weights || []).filter(w => w.batch_no || (w.weight && w.weight > 0) || w.photo_url);
      const filteredAttachments = (formData.attachments || []).filter(a => a.photo_url);

      const toTitleCase = (s: string) =>
        s
          .trim()
          .split(/\s+/)
          .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
          .join(' ');

      const finalData: CreateInspectionDTO = {
        ...formData,
        items: filteredItems,
        weights: filteredWeights,
        attachments: filteredAttachments,
        supplier_id: selectedSupplier!.id,
        producer_id: selectedProducer?.id,
        material_id: selectedMaterial?.id, // Added
        checker_id: formData.checker_id || user!.id,
        checker_signature: checkerSig,
        driver_signature: driverSig,
        warehouse_signature: warehouseSig,
        supervisor_signature: supervisorSig,
        status: isDraft ? 'pending' : 'completed'
      } as CreateInspectionDTO;

      if (finalData.nama_produsen || selectedProducer?.name) {
        const np = (finalData.nama_produsen || selectedProducer?.name || '').toString().trim();
        if (np) finalData.nama_produsen = np.toUpperCase();
      }
      if (finalData.pabrik_danone) {
        const lp = finalData.pabrik_danone.toString().trim();
        if (lp) finalData.pabrik_danone = lp.toUpperCase();
      }
      if (finalData.item_name || selectedMaterial?.name) {
        const mn = (finalData.item_name || selectedMaterial?.name || '').toString();
        if (mn) finalData.item_name = toTitleCase(mn);
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: inspectionId!, data: finalData });
        toast.success(isDraft ? 'Draft berhasil diperbarui' : 'Inspeksi berhasil diselesaikan');
      } else {
        const result = await createMutation.mutateAsync(finalData);
        toast.success(isDraft ? 'Draft berhasil disimpan' : 'Inspeksi berhasil disimpan');
        localStorage.removeItem(`inspection_draft_${user?.id}`);

        const newId = result.data?.id || result.id;
        if (newId) {
          navigate(`/incoming-inspection/${newId}`);
          return;
        }
      }

      navigate('/incoming-inspection');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || `Gagal ${isEdit ? 'memperbarui' : 'menyimpan'} inspeksi`);
    }
  };

  const steps = [
    { id: 'vehicle', label: 'Kendaraan', icon: Truck },
    { id: 'packaging', label: 'Kemasan', icon: Package },
    { id: 'qc', label: 'QC Material', icon: ShieldCheck },
    { id: 'weight', label: 'Timbangan', icon: Scale },
    { id: 'documents', label: 'Dokumen', icon: FileText },
    { id: 'signature', label: 'Selesai', icon: FileSignature },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/incoming-inspection')}
            className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{isEdit ? 'Edit Inspeksi Material' : 'Inspeksi Material Baru'}</h1>
            <p className="text-text-secondary text-xs">{isEdit ? `Mengubah data ${formData.inspection_no}` : 'Lengkapi semua tahapan inspeksi di bawah ini'}</p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[10px] font-medium">
            Draft Tersimpan Otomatis
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-surface-elevated p-3 rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id as FormStep);

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <button
                    onClick={() => {
                      // Only allow jumping back or to immediate next if current is valid
                      if (isCompleted || isActive || (idx > 0 && completedSteps.includes(steps[idx-1].id as FormStep))) {
                        setCurrentStep(step.id as FormStep);
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${isActive ? 'bg-primary text-white ring-4 ring-primary/20' :
                        isCompleted ? 'bg-green-500 text-white' : 'bg-surface border-2 border-border text-text-secondary'}`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </button>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-6 ${completedSteps.includes(step.id as FormStep) ? 'bg-green-500' : 'bg-border'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="bg-surface-elevated rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Official Paper-Style Header (Dynamic) */}
        <div className="border-b border-border bg-gray-50 dark:bg-dark-900/50 p-4 md:p-6">
          <div className="flex flex-col md:flex-row border-2 border-black bg-white dark:bg-dark-800 text-black">
            {/* Column 1: Logo Section */}
            <div className="md:w-1/4 p-4 border-b md:border-b-0 md:border-r-2 border-black flex flex-col items-center justify-center text-center">
              <img src={logoHeader} alt="Logo" className="h-10 mb-1" />
              <span className="text-[7px] font-black uppercase leading-tight">PT. SURYASUKSES ABADI PRIMA</span>
            </div>

            {/* Column 2: Title Section */}
            <div className="flex-1 p-4 border-b md:border-b-0 md:border-r-2 border-black flex flex-col items-center justify-center text-center font-black text-xs md:text-sm uppercase leading-tight">
              {currentStep === 'vehicle' && (
                <>
                  <span>PENGECEKAN</span>
                  <span>KENDARAAN</span>
                  <span>KEDATANGAN BARANG</span>
                </>
              )}
              {currentStep === 'packaging' && (
                <>
                  <span>HASIL PEMERIKSAAN</span>
                  <span>KEMASAN & KUANTITAS</span>
                </>
              )}
              {currentStep === 'qc' && (
                <>
                  <span>INCOMING MATERIAL</span>
                </>
              )}
              {(currentStep === 'weight' || currentStep === 'signature') && (
                <>
                  <span>LAPORAN INSPEKSI</span>
                  <span>MATERIAL MASUK</span>
                </>
              )}
            </div>

            {/* Column 3: Doc Info Section */}
            <div className="md:w-1/3 text-[9px] font-bold">
              <div className="grid grid-cols-[80px_1fr] border-b-2 border-black">
                <div className="p-1 px-2">No. Dok</div>
                <div className="p-1 px-2 border-l-2 border-black font-mono">
                  {currentStep === 'qc' ? 'FRM.QAQC.05.01.03' : 'FRM.QAQC.05.19.01'}
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] border-b-2 border-black">
                <div className="p-1 px-2">No. Rev</div>
                <div className="p-1 px-2 border-l-2 border-black font-mono">
                  {currentStep === 'qc' ? '07' : '03'}
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] border-b-2 border-black">
                <div className="p-1 px-2">Tanggal</div>
                <div className="p-1 px-2 border-l-2 border-black font-mono">23 April 2024</div>
              </div>
              <div className="grid grid-cols-[80px_1fr]">
                <div className="p-1 px-2">Hal</div>
                <div className="p-1 px-2 border-l-2 border-black font-mono">1 dari 1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Vehicle & Arrival (Layout Fix) */}
        {currentStep === 'vehicle' && (
          <div className="p-8 space-y-10 bg-white dark:bg-dark-950">
            {/* Section Kendaraan */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-1">
                <h4 className="text-sm font-black text-black dark:text-white uppercase flex items-center gap-2">
                  <div className="w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center text-[10px]">►</div>
                  Kendaraan
                </h4>
                <div className="text-xs font-bold text-black dark:text-white">
                  Tanggal : <span className="underline decoration-dotted ml-2">{format(new Date(formData.inspection_date!), 'dd/MM/yyyy')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-3 pt-2">
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold text-black dark:text-white w-24">No. Polisi</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold">:</span>
                    <input
                      placeholder="..."
                      value={formData.vehicle_no || ''}
                      onChange={e => updateFormData({ vehicle_no: e.target.value.toUpperCase() })}
                      className="flex-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-sm font-bold uppercase focus:border-black"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold text-black dark:text-white w-24">Nama Sopir</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold">:</span>
                    <input
                      placeholder="..."
                      value={formData.driver_name || ''}
                      onChange={e => updateFormData({ driver_name: e.target.value })}
                      className="flex-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-sm font-bold focus:border-black"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold text-black dark:text-white w-24">No. Telp.</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold">:</span>
                    <input
                      placeholder="..."
                      value={formData.driver_phone || ''}
                      onChange={e => updateFormData({ driver_phone: e.target.value })}
                      className="flex-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-sm font-bold focus:border-black"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold text-black dark:text-white w-24 shrink-0">Jenis Kendaraan</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold">:</span>
                    <select
                      value={formData.vehicle_type || 'Fuso'}
                      onChange={e => updateFormData({ vehicle_type: e.target.value })}
                      className="flex-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-sm font-bold focus:border-black"
                    >
                      <option value="Fuso">Fuso</option>
                      <option value="Truk">Truk</option>
                      <option value="Kontainer">Kontainer</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Kondisi Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-4">
              {/* Kondisi Kendaraan */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-black dark:text-white uppercase flex items-center gap-2 border-b border-black/20 pb-1">
                  <div className="w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center text-[10px]">►</div>
                  Kondisi Kendaraan
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10">
                    <span className="text-[11px] font-medium">- Jenis Bak</span>
                    <div className="flex gap-4">
                      {['Box', 'Terpal'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="vehicle_cover_type"
                            checked={formData.vehicle_cover_type === type}
                            onChange={() => updateFormData({ vehicle_cover_type: type })}
                            className="w-3 h-3 border-2 border-black"
                          />
                          <span className="text-[10px] font-black">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {[
                    { label: 'Kebersihan', field: 'vehicle_clean' },
                    { label: 'Tidak Berbau', field: 'vehicle_no_odor' },
                    { label: 'Kedatangan Tepat Waktu', field: 'vehicle_on_time' },
                    { label: 'Pengiriman Tepat Waktu', field: 'vehicle_on_time_delivery' },
                  ].map(item => (
                    <div key={item.field} className="flex items-center justify-between">
                      <span className="text-[11px] font-medium">- {item.label}</span>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-2 border-black"
                            checked={formData[item.field as keyof CreateInspectionDTO] === 1}
                            onChange={() => updateFormData({ [item.field]: 1 })}
                          />
                          <span className="text-[10px] font-black">OK</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-2 border-black"
                            checked={formData[item.field as keyof CreateInspectionDTO] === 0}
                            onChange={() => updateFormData({ [item.field]: 0 })}
                          />
                          <span className="text-[10px] font-black">Tidak</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kondisi Barang */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-black dark:text-white uppercase flex items-center gap-2 border-b border-black/20 pb-1">
                  <div className="w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center text-[10px]">►</div>
                  Kondisi Barang
                </h4>
                <div className="space-y-2">
                  {[
                    { label: 'Tidak Basah', field: 'item_not_wet' },
                    { label: 'Tidak Robek', field: 'item_not_torn' },
                    { label: 'Tidak Berdebu', field: 'item_not_dusty' },
                    { label: 'Tertutup rapat *)', field: 'item_closed_tight' },
                    { label: 'Tidak Tercampur dengan barang haram', field: 'item_no_haram' },
                  ].map(item => (
                    <div key={item.field} className="flex items-center justify-between">
                      <span className="text-[11px] font-medium">- {item.label}</span>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-2 border-black"
                            checked={formData[item.field as keyof CreateInspectionDTO] === 1}
                            onChange={() => updateFormData({ [item.field]: 1 })}
                          />
                          <span className="text-[10px] font-black">OK</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-2 border-black"
                            checked={formData[item.field as keyof CreateInspectionDTO] === 0}
                            onChange={() => updateFormData({ [item.field]: 0 })}
                          />
                          <span className="text-[10px] font-black">Tidak</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-bold italic leading-tight mt-2 text-black/60">*) Kondisi plakban pada box / kondisi benang pada zak</p>
              </div>
            </div>

            {/* Section Hasil Hitung Bongkar */}
            <div className="pt-8 border-t-2 border-black space-y-6">
              <h4 className="text-sm font-black text-black dark:text-white uppercase flex items-center gap-2">
                <div className="w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center text-[10px]">►</div>
                Hasil Hitung Bongkar
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-y-3 max-w-2xl">
                {[
                  { label: 'Nama Supplier', value: selectedSupplier?.name, isPicker: true, component: <SupplierPicker selectedSupplier={selectedSupplier} onChange={setSelectedSupplier} /> },
                  { label: 'Nama Produsen', value: selectedProducer?.name, isPicker: true, component: <ProducerPicker selectedProducer={selectedProducer} onChange={setSelectedProducer} /> },
                  { label: 'Nama Material', value: selectedMaterial?.name, isPicker: true, component: <MaterialPicker selectedMaterial={selectedMaterial} onChange={setSelectedMaterial} /> },
                  { label: 'Negara Produsen', field: 'negara_produsen', value: formData.negara_produsen },
                  { label: 'Lokasi Pabrik', value: selectedPlant?.name, isPicker: true, component: <PlantPicker selectedPlant={selectedPlant} onChange={(p)=>{ setSelectedPlant(p); updateFormData({ pabrik_danone: p?.name || '' }); }} /> },
                  { label: 'No. Seal', field: 'no_seal', value: (formData as any).no_seal },
                  { label: 'No. PO', field: 'po_no', value: (formData as any).po_no },
                  { label: 'No. Surat Jalan', field: 'surat_jalan_no', value: (formData as any).surat_jalan_no },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <label className="text-[11px] font-bold text-black dark:text-white w-32 shrink-0">{item.label}</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      {item.isPicker ? (
                        <div className="flex-1">{item.component}</div>
                      ) : (
                        <input
                          placeholder="..."
                          value={item.value || ''}
                          onChange={e => updateFormData({ [item.field!]: e.target.value })}
                          className="flex-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-sm font-medium focus:border-black"
                        />
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold text-black dark:text-white w-32 shrink-0">Logo Halal</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold">:</span>
                    <select
                      value={formData.logo_halal || 'Ada'}
                      onChange={e => updateFormData({ logo_halal: e.target.value })}
                      className="flex-1 border-b border-black/30 bg-transparent outline-none text-sm font-bold text-primary py-1"
                    >
                      <option value="Ada">Ada</option>
                      <option value="Tidak Ada">Tidak Ada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Selection for Units (Dynamic) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-2 items-start">
                <div className="flex items-start gap-4">
                  <label className="text-[11px] font-bold text-black dark:text-white w-32 shrink-0">Jenis Kemasan</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold">:</span>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:flex-wrap gap-2 items-start">
                        <select
                          value={formData.packaging_unit || 'ZAK'}
                          onChange={e => updateFormData({ packaging_unit: e.target.value })}
                          className="md:flex-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-sm font-bold focus:border-black uppercase min-w-[160px] max-w-full"
                        >
                          {packagingUnits.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            value={newPackagingUnit}
                            onChange={e => setNewPackagingUnit(e.target.value)}
                            placeholder="Tambah jenis..."
                            className="w-full md:w-48 px-2 py-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-xs font-medium uppercase focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = (newPackagingUnit || '').trim().toUpperCase();
                              if (!val) return;
                              if (!packagingUnits.includes(val)) {
                                setPackagingUnits(prev => [...prev, val]);
                              }
                              updateFormData({ packaging_unit: val });
                              setNewPackagingUnit('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-black text-white text-[10px] font-bold uppercase hover:bg-black/80 transition-colors whitespace-nowrap"
                            title="Tambah Jenis Kemasan"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <label className="text-[11px] font-bold text-black dark:text-white w-32 shrink-0">Satuan Ukuran</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold">:</span>
                    <select
                      value={formData.measure_unit || 'KG'}
                      onChange={e => updateFormData({ measure_unit: e.target.value })}
                      className="flex-1 border-b border-black/30 dark:border-white/30 bg-transparent outline-none text-sm font-bold focus:border-black uppercase"
                    >
                      {['KG', 'PCS', 'LITER', 'METER', 'ROLL', 'TON'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabel Jumlah */}
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-black text-black dark:text-white uppercase flex items-center gap-2">
                  <div className="w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center text-[10px]">►</div>
                  Jumlah
                </h4>
                <div className="overflow-x-auto border-2 border-black">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-white text-black border-b-2 border-black font-black text-center">
                      <tr className="divide-x-2 divide-black">
                        <th className="px-3 py-2 w-10">NO</th>
                        <th className="px-3 py-2">NO. BATCH</th>
                        <th className="px-3 py-2">BATCH VENDOR</th>
                        <th className="px-3 py-2">EXPIRED DATE</th>
                        <th className="px-3 py-2 w-32">JML KEMASAN ({formData.packaging_unit || 'UNIT'})</th>
                        <th className="px-3 py-2 w-32">ISI PER KEMASAN ({formData.measure_unit || 'KG'})</th>
                        <th className="px-3 py-2 w-40">TOTAL ({formData.measure_unit || 'KG'})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black text-black">
                      {formData.items?.slice(0, 10).map((item, idx) => {
                        const qty = Number(item.qty) || 0;
                        const weight = Number(item.weight_per_unit) || 0;
                        const total = qty * weight;
                        return (
                          <tr key={idx} className="divide-x divide-black bg-white">
                            <td className="p-1.5 text-center font-bold bg-gray-50">{idx + 1}</td>
                            <td className="p-0"><input value={item.batch_no || ''} onChange={e => updateQCItem(idx, 'batch_no', e.target.value)} className="w-full px-2 py-1.5 bg-transparent outline-none text-center font-medium" placeholder="..." /></td>
                            <td className="p-0"><input value={item.batch_vendor || ''} onChange={e => updateQCItem(idx, 'batch_vendor', e.target.value)} className="w-full px-2 py-1.5 bg-transparent outline-none text-center font-medium" placeholder="..." /></td>
                            <td className="p-0"><input value={item.expired_date || ''} onChange={e => updateQCItem(idx, 'expired_date', e.target.value)} className="w-full px-2 py-1.5 bg-transparent outline-none text-center" placeholder="DD/MM/YYYY" /></td>
                            <td className="p-0"><input type="number" value={item.qty || ''} onChange={e => updateQCItem(idx, 'qty', parseFloat(e.target.value))} className="w-full px-2 py-1.5 bg-transparent outline-none text-center font-bold" placeholder="0" /></td>
                            <td className="p-0"><input type="number" value={item.weight_per_unit || ''} onChange={e => updateQCItem(idx, 'weight_per_unit', parseFloat(e.target.value))} className="w-full px-2 py-1.5 bg-transparent outline-none text-center font-bold" placeholder="0" /></td>
                            <td className="p-0 bg-gray-50 text-center font-black py-1.5">{total > 0 ? total.toLocaleString() : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 text-black font-black border-t-2 border-black">
                      <tr className="divide-x divide-black text-center uppercase">
                        <td colSpan={6} className="px-3 py-2 text-right">Total Keseluruhan ({formData.measure_unit || 'KG'})</td>
                        <td className="px-3 py-2 border-l-2 border-black text-lg text-primary">
                          {(formData.items || []).reduce((acc, curr) => acc + ((Number(curr.qty) || 0) * (Number(curr.weight_per_unit) || 0)), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Packaging & Quantity (High Fidelity Template) */}
        {currentStep === 'packaging' && (
          <div className="p-8 space-y-8 bg-white dark:bg-dark-950 text-black">
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase flex items-center gap-2 border-b-2 border-black pb-1">
                <div className="w-4 h-4 bg-black text-white rounded-sm flex items-center justify-center text-[10px]">1</div>
                Pemeriksaan Kemasan
              </h4>
              <p className="text-[10px] font-bold text-black/60 italic uppercase tracking-tight">Beri tanda ( V ) pada kondisi kemasan :</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'KONDISI KEMASAN', opts: ['BAIK', 'RUSAK', 'RUSAK SEBAGIAN'], field: 'pkg_condition' },
                  { label: 'NAMA BARANG', opts: ['ADA', 'TIDAK ADA'], field: 'pkg_name_check' },
                  { label: 'LABEL BAHAYA', opts: ['ADA', 'TIDAK ADA', 'TIDAK PERLU'], field: 'pkg_hazard_label' },
                ].map((group) => (
                  <div key={group.field} className="border-2 border-black overflow-hidden flex flex-col shadow-sm">
                    <div className="bg-black text-white text-center py-1 text-[9px] font-black uppercase">{group.label}</div>
                    <div className="flex-1 flex divide-x divide-black border-t border-black">
                      {group.opts.map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateFormData({ [group.field]: opt })}
                          className={`flex-1 py-3 flex flex-col items-center justify-between transition-all hover:bg-gray-50
                            ${formData[group.field as keyof CreateInspectionDTO] === opt ? 'bg-blue-50/50' : 'bg-white'}`}
                        >
                          <span className="text-[8px] font-black mb-2 px-1 text-center leading-tight h-4 flex items-center">{opt}</span>
                          <div className="w-6 h-6 border-2 border-black flex items-center justify-center bg-white">
                            {formData[group.field as keyof CreateInspectionDTO] === opt && (
                              <span className="text-black font-black text-lg">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-bold shrink-0">Catatan :</label>
                  <input
                    value={formData.packaging_notes || ''}
                    onChange={e => updateFormData({ packaging_notes: e.target.value })}
                    className="flex-1 border-b-2 border-black/20 bg-transparent outline-none text-sm font-bold focus:border-black py-1"
                    placeholder="..."
                  />
                </div>
                <div className="border-b-2 border-black/10 h-6 w-full ml-16"></div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-black">
              <h4 className="text-sm font-black uppercase flex items-center gap-2">
                <div className="w-4 h-4 bg-black text-white rounded-sm flex items-center justify-center text-[10px]">2</div>
                Pemeriksaan Jumlah Barang
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black/40">Total Kedatangan (Seluruh Unit)</label>
                  <div className="flex items-baseline gap-2 border-b-2 border-black pb-1">
                    <span className="text-3xl font-black text-primary px-2">
                      {(formData.items || []).reduce((acc, curr) => acc + ((Number(curr.qty) || 0) * (Number(curr.weight_per_unit) || 0)), 0).toLocaleString()}
                    </span>
                    <span className="font-black text-sm text-black">{formData.measure_unit || 'KG'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-green-600/60">Total Penerimaan (Hanya OK)</label>
                  <div className="flex items-baseline gap-2 border-b-2 border-green-600 pb-1 bg-green-50/30">
                    <span className="text-3xl font-black text-green-600 px-2">
                      {(formData.total_items_received || 0).toLocaleString()}
                    </span>
                    <span className="font-black text-sm text-green-700">{formData.measure_unit || 'KG'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex-1 flex items-center gap-2 border-b-2 border-black/20">
                  <span className="text-[9px] font-bold text-black/40 shrink-0">Keterangan Tambahan :</span>
                  <input
                    value={formData.total_items_received_text || ''}
                    onChange={e => updateFormData({ total_items_received_text: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-xs font-bold py-1"
                    placeholder="Contoh: (17.600 kg @1100 kg)"
                  />
                </div>
              </div>

              {/* Grid: Sampling Table (Single) + Big Note Box (Right) */}
              <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-4">
                {/* Left: Single Sampling Table (65%) */}
                <div className="w-full lg:w-[65%] border-2 border-black shadow-sm bg-white">
                  <div className="bg-black text-white text-center py-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4">
                    <span>Hasil Sampling ({formData.packaging_unit})</span>
                  </div>
                  {/* Build dropdown sources from items input */}
                  {(() => {
                    const validBatches = (formData.items || [])
                      .map(i => i.batch_no)
                      .filter(b => b && b.trim() !== '');
                    const validVendorBatches = (formData.items || [])
                      .map(i => (i as any).batch_vendor as string | undefined)
                      .filter(b => b && b.trim() !== '');
                    const uniqueBatches = Array.from(new Set(validBatches));
                    const uniqueVendorBatches = Array.from(new Set(validVendorBatches));

                    return (
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-gray-50 text-black border-b-2 border-black font-black text-center">
                          <tr className="divide-x-2 divide-black uppercase">
                            <th className="w-8 py-1.5 text-[8px]">No</th>
                            <th className="px-2 text-[8px]">Batch</th>
                            <th className="px-2 text-[8px]">Batch Vendor</th>
                            <th className="w-28 text-[8px]">Berat Timbangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {Array.from({ length: 20 }).map((_, idx) => {
                            const itm = formData.items?.[idx];
                            return (
                              <tr key={idx} className="divide-x-2 divide-black">
                                <td className="text-center font-black py-1 bg-gray-50/50">{idx + 1}</td>
                                <td className="p-0 bg-white">
                                  <select
                                    className="w-full px-1 py-1.5 bg-transparent outline-none font-medium"
                                    value={itm?.batch_no || ''}
                                    onChange={e => updateQCItem(idx, 'batch_no', e.target.value)}
                                  >
                                    <option value=""></option>
                                    {uniqueBatches.map(b => (
                                      <option key={b} value={b}>{b}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-0 bg-white">
                                  <select
                                    className="w-full px-1 py-1.5 bg-transparent outline-none font-medium"
                                    value={(itm as any)?.batch_vendor || ''}
                                    onChange={e => updateQCItem(idx, 'batch_vendor' as any, e.target.value)}
                                  >
                                    <option value=""></option>
                                    {uniqueVendorBatches.map(bv => (
                                      <option key={bv} value={bv}>{bv}</option>
                                    ))}
                                  </select>
                                </td>
                                  <td className="p-0 bg-white">
                                    <input
                                      type="number"
                                      value={(itm as any)?.scale_weight || ''}
                                      onChange={e => updateQCItem(idx, 'scale_weight' as any, parseFloat(e.target.value))}
                                      className="w-full px-1 py-1.5 bg-transparent outline-none text-right font-black"
                                      placeholder="0"
                                    />
                                  </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* No total footer: form is input-only */}
                      </table>
                    );
                  })()}
                </div>

                {/* Right: Big CATATAN Box (35%) */}
                <div className="w-full lg:w-[35%] flex flex-col border-2 border-black bg-white shadow-sm overflow-hidden">
                  <div className="bg-black text-white text-center py-1 text-[10px] font-black uppercase tracking-widest">Catatan</div>
                  <textarea
                    value={formData.notes || ''}
                    onChange={e => updateFormData({ notes: e.target.value })}
                    className="flex-1 w-full p-4 text-[13px] font-bold text-primary resize-none outline-none leading-relaxed placeholder:font-normal placeholder:italic"
                    placeholder="Contoh:&#10;Batch 2601289732 = 2 jumbo&#10;Batch vendor 251208 = 2 jumbo..."
                  />
                  <div className="p-2 bg-gray-50 border-t border-black/10 text-[9px] font-bold italic text-black/40 text-center">
                    Tulis rincian atau keterangan tambahan sampling
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-8">
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-black uppercase w-32 shrink-0">Mulai Bongkar :</label>
                  <div className="flex-1 flex items-center gap-2 border-b-2 border-black">
                    <input
                      type="time"
                      value={formData.unloading_start_time || ''}
                      onChange={e => updateFormData({ unloading_start_time: e.target.value })}
                      className="flex-1 bg-transparent outline-none text-sm font-black py-1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-[11px] font-black uppercase w-32 shrink-0">Selesai Bongkar :</label>
                  <div className="flex-1 flex items-center gap-2 border-b-2 border-black">
                    <input
                      type="time"
                      value={formData.unloading_end_time || ''}
                      onChange={e => updateFormData({ unloading_end_time: e.target.value })}
                      className="flex-1 bg-transparent outline-none text-sm font-black py-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Material QC (High Fidelity Template FRM.QAQC.05.01.03) */}
        {currentStep === 'qc' && (
          <div className="p-6 space-y-8 bg-white dark:bg-dark-950 text-black">
            {/* P3 Metadata Grid */}
            <div className="border-2 border-black overflow-hidden shadow-sm">
              <div className="bg-black text-white text-center py-1.5 text-xs font-black uppercase tracking-widest">Incoming Material (FRM.QAQC.05.01.03)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black">
                <div className="divide-y divide-black/20">
                  <div className="p-3 flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase shrink-0">Material</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold">
                      {['Resin', 'Masterbatch', 'Tinta', 'Plastik', 'Carton Box', 'Plakban', 'Karung', 'Sheet Tray', 'Benang', 'Plate', 'Pallet'].map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="mat_type" checked={formData.material_type === t} onChange={() => updateFormData({ material_type: t })} className="w-3.5 h-3.5 border-2 border-black" />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Nama Supplier</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <SupplierPicker selectedSupplier={selectedSupplier} onChange={setSelectedSupplier} />
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Nama Produsen</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <ProducerPicker selectedProducer={selectedProducer} onChange={setSelectedProducer} />
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Tgl Pengecekan</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <input type="date" value={formData.inspection_date || ''} onChange={e => updateFormData({ inspection_date: e.target.value })} className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs font-bold focus:border-black" />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-black/20">
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Batch / Lot No.</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <input value={formData.items?.[0]?.batch_no || ''} onChange={e => updateQCItem(0, 'batch_no', e.target.value)} className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs font-bold focus:border-black" />
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Warna</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <input value={formData.warna || ''} onChange={e => updateFormData({ warna: e.target.value })} className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs font-bold focus:border-black" />
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Jumlah Sampling</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <input
                        value={formData.jumlah_sampling || ''}
                        onChange={e => updateFormData({ jumlah_sampling: e.target.value })}
                        className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs font-bold focus:border-black"
                        placeholder={`Misal: 6 ${formData.packaging_unit || 'Palet'}`}
                      />
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Tgl Produksi</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <input value={formData.tanggal_produksi || ''} onChange={e => updateFormData({ tanggal_produksi: e.target.value })} className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs font-bold focus:border-black" />
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <label className="text-[10px] font-black w-28 uppercase shrink-0">Expired Date</label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-bold">:</span>
                      <input value={formData.expired_date || ''} onChange={e => updateFormData({ expired_date: e.target.value })} className="flex-1 border-b border-black/20 bg-transparent outline-none text-xs font-bold focus:border-black" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-1">
                <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Checklist Hasil Pengecekan
                </h3>
              </div>

              <div className="border-2 border-black divide-y-2 divide-black overflow-hidden shadow-sm">
                <div className="grid grid-cols-[1.5fr_1.2fr_45px_45px_35px_35px] bg-gray-100 text-[9px] font-black uppercase divide-x-2 divide-black items-center text-center">
                  <div className="py-2">Item Pengecekan</div>
                  <div className="py-2">Standart</div>
                  <div className="py-2">Score</div>
                  <div className="py-2">AQL</div>
                  <div className="py-2">Ac</div>
                  <div className="py-2">Re</div>
                </div>

                <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase">I. KUALITAS :</div>
                {[
                  { label: '1. Berat', std: 'Sesuai standart di ITP (Timbangan)', scr: '30/25', aql: '4.0', field: 'q_berat' },
                  { label: '2. Fungsional', std: '', scr: '25', aql: '', field: '' },
                  { label: '   a. Joint', std: 'Las merekat kuat tidak lepas saat ditarik, joint gap box 3-9mm', scr: '', aql: '4.0', field: 'q_joint' },
                  { label: '   b. Creasing / Lipatan', std: 'Mudah di lipat dan tidak pecah (box tidak sobek saat dibentuk)', scr: '', aql: '4.0', field: 'q_creasing' },
                  { label: '3. CoA', std: '', scr: '40/25', aql: '', field: '' },
                  { label: '   a. Panjang', std: 'Sesuai standar di ITP (Dimensi)', scr: '', aql: '4.0', field: 'q_coa_panjang' },
                  { label: '   b. Lebar', std: 'Sesuai standar di ITP (Dimensi)', scr: '', aql: '4.0', field: 'q_coa_lebar' },
                  { label: '   c. Tinggi', std: 'Sesuai standar di ITP (Dimensi)', scr: '', aql: '4.0', field: 'q_coa_tinggi' },
                  { label: '   d. Tebal', std: 'Sesuai standar di ITP (Micrometer/Caliper)', scr: '', aql: '4.0', field: 'q_coa_tebal' },
                  { label: '   e. BCT', std: 'Sesuai standar di ITP (Compression Test)', scr: '', aql: '4.0', field: 'q_coa_bct' },
                  { label: '   f. Cobb size', std: 'Sesuai standar di ITP (Water Absorption)', scr: '', aql: '4.0', field: 'q_coa_cobb' },
                  { label: '   g. Bursting strength', std: 'Sesuai standar di ITP (Bursting Test)', scr: '', aql: '4.0', field: 'q_coa_bursting' },
                  { label: '   h. Batch / Lot No', std: 'Sesuai CoA, masa penyimpanan tinta maks 6 bulan', scr: '', aql: '4.0', field: 'q_coa_batch_lot' },
                  { label: '   i. Color Chip', std: 'Warna cetakan sesuai dengan color chip / standar pantone', scr: '', aql: '4.0', field: 'q_coa_color_chip' },
                  { label: '4. Visual', std: '', scr: '30/25', aql: '', field: '' },
                  { label: '   a. Sobek/Cacat', std: 'Tidak sobek, tidak cacat produksi, bebas kotoran/noda', scr: '', aql: '4.0', field: 'q_visual_sobek' },
                  { label: '   b. Kondisi cetakan', std: 'Tajam, tidak blur, register tepat (maks bergeser 1 mm)', scr: '', aql: '6.5', field: 'q_visual_cetakan' },
                  { label: '   c. Kondisi flutting', std: 'Flutting tidak patah (patah maks 2 titik)', scr: '', aql: '6.5', field: 'q_visual_flutting' },
                  { label: '   d. Packaging', std: 'Kondisi kemasan rapi, identitas/label jelas terbaca', scr: '', aql: '6.5', field: 'q_visual_packaging' },
                  { label: '   e. Warna', std: 'Sesuai dengan color range / CoA vendor', scr: '', aql: '6.5', field: 'q_visual_warna' },
                  { label: '   f. Clarity', std: 'Transparansi sesuai standar (untuk material transparan)', scr: '', aql: '6.5', field: 'q_visual_clarity' },
                ].map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1.5fr_1.2fr_45px_45px_35px_35px] divide-x-2 divide-black items-center bg-white">
                    <div className={`p-2 text-[10px] ${item.field ? 'font-bold' : 'font-black'}`}>{item.label}</div>
                    <div className="p-2 text-[9px] italic leading-tight text-center">{item.std}</div>
                    <div className="p-2 text-[9px] font-black text-center">{item.scr}</div>
                    <div className="p-2 text-[9px] font-bold text-center">{item.aql}</div>
                    <div className="p-1 flex justify-center">
                      {item.field && (
                        <button
                          onClick={() => updateQCParam(item.field as any, ((formData.qc_params as any)?.[item.field]) === 1 ? 0 : 1)}
                          className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${((formData.qc_params as any)?.[item.field]) === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-black/10'}`}
                        >
                          {((formData.qc_params as any)?.[item.field]) === 1 ? <span className="font-black text-xs">O</span> : null}
                        </button>
                      )}
                    </div>
                    <div className="p-1 flex justify-center">
                      {item.field && (
                        <button
                          onClick={() => updateQCParam(item.field as any, ((formData.qc_params as any)?.[item.field]) === 2 ? 0 : 2)}
                          className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${((formData.qc_params as any)?.[item.field]) === 2 ? 'bg-red-600 text-white border-red-600' : 'bg-white border-black/10'}`}
                        >
                          {((formData.qc_params as any)?.[item.field]) === 2 ? <span className="font-black text-xs">O</span> : null}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase">II. KEAMANAN PANGAN :</div>
                {[
                  { label: '1. Material', std: '', scr: '50', aql: '', field: '' },
                  { label: '   a. Bersih', std: 'Kering, tidak basah, bebas debu, bebas serangga, olie, benda asing', scr: '', aql: '0.65', field: 'fs_mat_bersih' },
                  { label: '   b. Bau', std: 'Bebas dari bau asing / menyengat (odorless)', scr: '', aql: '', field: 'fs_mat_bau' },
                  { label: '2. Kendaraan', std: '', scr: '50', aql: '', field: '' },
                  { label: '   a. Bersih', std: 'Bebas dari debu, kotoran, oli, serangga, atau benda asing', scr: '', aql: '4.0', field: 'fs_veh_bersih' },
                  { label: '   b. Bau', std: 'Bak kendaraan tidak berbau asing yang kontaminan', scr: '', aql: '', field: 'fs_veh_bau' },
                  { label: '   c. Kondisi Bak', std: 'Tertutup rapat, pintu terkunci, bersegel utuh', scr: '', aql: '', field: 'fs_veh_bak' },
                  { label: '   d. Segel Kendaraan', std: 'Segel terpasang, nomor sesuai dengan surat jalan', scr: '', aql: '', field: 'fs_veh_segel' },
                ].map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1.5fr_1.2fr_45px_45px_35px_35px] divide-x-2 divide-black items-center bg-white">
                    <div className={`p-2 text-[10px] ${item.field ? 'font-bold' : 'font-black'}`}>{item.label}</div>
                    <div className="p-2 text-[9px] italic leading-tight text-center">{item.std}</div>
                    <div className="p-2 text-[9px] font-black text-center">{item.scr}</div>
                    <div className="p-2 text-[9px] font-bold text-center">{item.aql}</div>
                    <div className="p-1 flex justify-center">
                      {item.field && (
                        <button
                          onClick={() => updateQCParam(item.field as any, ((formData.qc_params as any)?.[item.field]) === 1 ? 0 : 1)}
                          className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${((formData.qc_params as any)?.[item.field]) === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-black/10'}`}
                        >
                          {((formData.qc_params as any)?.[item.field]) === 1 ? <span className="font-black text-xs">O</span> : null}
                        </button>
                      )}
                    </div>
                    <div className="p-1 flex justify-center">
                      {item.field && (
                        <button
                          onClick={() => updateQCParam(item.field as any, ((formData.qc_params as any)?.[item.field]) === 2 ? 0 : 2)}
                          className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${((formData.qc_params as any)?.[item.field]) === 2 ? 'bg-red-600 text-white border-red-600' : 'bg-white border-black/10'}`}
                        >
                          {((formData.qc_params as any)?.[item.field]) === 2 ? <span className="font-black text-xs">O</span> : null}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t-4 border-black space-y-6">
                <div className="flex flex-wrap gap-8 items-center bg-gray-50 p-4 border-2 border-black">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-black uppercase">Score Kualitas :</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={formData.qc_params?.qc_score ?? 0}
                        onChange={e => updateQCParam('qc_score', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border-2 border-black text-center font-black outline-none focus:bg-blue-50"
                      />
                      <span className="ml-2 font-black">%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-black uppercase">Score Keamanan :</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={formData.qc_params?.fs_score ?? 0}
                        onChange={e => updateQCParam('fs_score', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border-2 border-black text-center font-black outline-none focus:bg-blue-50"
                      />
                      <span className="ml-2 font-black">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black uppercase block mb-4">Keputusan Pemeriksaan :</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {['Di terima', 'AOD', 'Hold', 'Rejected'].map(choice => (
                      <button
                        key={choice}
                        onClick={() => updateQCParam('decision', choice)}
                        className={`py-4 px-3 border-4 font-black text-sm uppercase transition-all shadow-sm
                          ${formData.qc_params?.decision === choice ? 'bg-black text-white border-black scale-105 shadow-xl' : 'bg-white text-black border-black/20 hover:border-black'}`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Weights & Photos */}
        {currentStep === 'weight' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Scale className="w-6 h-6 text-primary" />
                LAMPIRAN DATA BERAT TIMBANGAN
              </h3>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  weights: [...(prev.weights || []), { batch_no: '', weight: 0, photo_url: '' }]
                }))}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-black/80 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Baris Foto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(formData.weights || []).map((w, idx) => {
                // Build batch options from sampling items (allow duplicates selection)
                const validBatches = (formData.items || [])
                  .map(i => i.batch_no)
                  .filter(b => b && b.trim() !== '');
                const uniqueAvailableBatches = [...new Set(validBatches)];

                // Build vendor batch options
                const validVendorBatches = (formData.items || [])
                  .map(i => (i as any).batch_vendor as string | undefined)
                  .filter(b => b && b.trim() !== '');
                const uniqueAvailableVendorBatches = [...new Set(validVendorBatches)];

                return (
                  <div key={idx} className="flex flex-col border border-border rounded-xl bg-surface overflow-hidden shadow-sm relative">
                    <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                      #{idx + 1}
                    </div>
                    {/* Delete button for rows > 6 */}
                    {idx >= 6 && (
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          weights: prev.weights?.filter((_, i) => i !== idx)
                        }))}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                        title="Hapus Baris"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    <div className="aspect-video relative bg-gray-100 dark:bg-dark-800 group">
                      {w.photo_url ? (
                        <>
                          <img
                            src={w.photo_url.startsWith('http') ? w.photo_url : `${window.location.origin}${w.photo_url.startsWith('/') ? '' : '/'}${w.photo_url}`}
                            className="w-full h-full object-cover"
                            alt={`Evidence ${idx + 1}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const backendUrl = `http://${window.location.hostname}:5555${w.photo_url!.startsWith('/') ? '' : '/'}${w.photo_url}`;
                              if (target.src !== backendUrl) {
                                target.src = backendUrl;
                              }
                            }}
                          />
                          <button
                            onClick={() => updateWeight(idx, 'photo_url', '')}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary hover:text-primary cursor-pointer transition-colors">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-[10px] font-bold uppercase">Ambil Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleFileUpload(idx, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                    <div className="p-3 space-y-2 border-t border-border">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">No. Batch</label>
                        <select
                          value={w.batch_no || ''}
                          onChange={e => updateWeight(idx, 'batch_no', e.target.value)}
                          className="text-xs px-2 py-1.5 border border-border rounded bg-transparent focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value=""></option>
                          {uniqueAvailableBatches.length > 0 ? (
                            uniqueAvailableBatches.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))
                          ) : (
                            <option disabled>Tidak ada data batch</option>
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">No. Batch Vendor</label>
                        <select
                          value={(w as any).batch_vendor || ''}
                          onChange={e => updateWeight(idx, 'batch_vendor' as any, e.target.value)}
                          className="text-xs px-2 py-1.5 border border-border rounded bg-transparent focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value=""></option>
                          {uniqueAvailableVendorBatches.length > 0 ? (
                            uniqueAvailableVendorBatches.map(bv => (
                              <option key={bv} value={bv}>{bv}</option>
                            ))
                          ) : (
                            <option disabled>Tidak ada data batch vendor</option>
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">Berat Timbangan (KG)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={w.weight || ''}
                          onChange={e => updateWeight(idx, 'weight', parseFloat(e.target.value))}
                          placeholder="0.0"
                          className="text-xs px-2 py-1.5 border border-border rounded bg-transparent font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed italic">
                * Lampiran ini akan disusun secara otomatis dalam grid pada dokumen PDF laporan inspeksi.
                Jika foto lebih dari 6, akan otomatis dibuatkan halaman baru.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Document Attachments */}
        {currentStep === 'documents' && (
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                LAMPIRAN DOKUMEN (SJ, TTB, COA)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Surat Jalan & TTB Row */}
              <div className="space-y-6">
                <div className="flex flex-col border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
                  <div className="bg-gray-50 dark:bg-dark-900/50 px-4 py-2 border-b border-border">
                    <span className="text-xs font-black uppercase tracking-wider">1. Surat Jalan</span>
                  </div>
                  <div className="aspect-video relative bg-gray-100 dark:bg-dark-800 group">
                    {formData.surat_jalan_photo_url ? (
                      <>
                        <img
                          src={formData.surat_jalan_photo_url.startsWith('http') ? formData.surat_jalan_photo_url : `${window.location.origin}${formData.surat_jalan_photo_url.startsWith('/') ? '' : '/'}${formData.surat_jalan_photo_url}`}
                          className="w-full h-full object-contain"
                          alt="Surat Jalan"
                        />
                        <button
                          onClick={() => updateFormData({ surat_jalan_photo_url: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary hover:text-primary cursor-pointer transition-colors">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold uppercase">Foto Surat Jalan</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleFileUpload('surat_jalan_photo_url', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex flex-col border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
                  <div className="bg-gray-50 dark:bg-dark-900/50 px-4 py-2 border-b border-border">
                    <span className="text-xs font-black uppercase tracking-wider">2. TTB (Tanda Terima Barang)</span>
                  </div>
                  <div className="aspect-video relative bg-gray-100 dark:bg-dark-800 group">
                    {formData.ttb_photo_url ? (
                      <>
                        <img
                          src={formData.ttb_photo_url.startsWith('http') ? formData.ttb_photo_url : `${window.location.origin}${formData.ttb_photo_url.startsWith('/') ? '' : '/'}${formData.ttb_photo_url}`}
                          className="w-full h-full object-contain"
                          alt="TTB"
                        />
                        <button
                          onClick={() => updateFormData({ ttb_photo_url: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary hover:text-primary cursor-pointer transition-colors">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold uppercase">Foto TTB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleFileUpload('ttb_photo_url', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* COA Column (Full Height style) */}
              <div className="flex flex-col border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
                <div className="bg-gray-50 dark:bg-dark-900/50 px-4 py-2 border-b border-border">
                  <span className="text-xs font-black uppercase tracking-wider">3. COA (Certificate of Analysis)</span>
                </div>
                <div className="flex-1 min-h-[400px] relative bg-gray-100 dark:bg-dark-800 group">
                  {formData.coa_photo_url ? (
                    <>
                      <img
                        src={formData.coa_photo_url.startsWith('http') ? formData.coa_photo_url : `${window.location.origin}${formData.coa_photo_url.startsWith('/') ? '' : '/'}${formData.coa_photo_url}`}
                        className="w-full h-full object-contain"
                        alt="COA"
                      />
                      <button
                        onClick={() => updateFormData({ coa_photo_url: '' })}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary hover:text-primary cursor-pointer transition-colors">
                      <Camera className="w-12 h-12 mb-3" />
                      <span className="text-xs font-black uppercase tracking-widest">Foto COA</span>
                      <p className="text-[10px] mt-2 opacity-50 italic">Ambil foto dokumen COA secara vertikal agar terbaca jelas</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleFileUpload('coa_photo_url', e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed italic">
                * Lampiran Surat Jalan dan TTB akan digabung dalam 1 lembar PDF. Dokumen COA akan dicetak pada lembar tersendiri.
              </p>
            </div>

            {/* Other Attachments Section */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-text-primary uppercase flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Lampiran Foto Lainnya (Opsional)
                </h4>
                <label className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-black/80 transition-colors shadow-sm cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Tambah Foto Lainnya
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(file => handleAttachmentUpload(file));
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(formData.attachments || []).map((att, idx) => (
                  <div key={idx} className="flex flex-col border border-border rounded-xl bg-surface overflow-hidden shadow-sm relative">
                     <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      title="Hapus Lampiran"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="aspect-video relative bg-gray-100 dark:bg-dark-800 group">
                      <img
                        src={att.photo_url.startsWith('http') ? att.photo_url : `${window.location.origin}${att.photo_url.startsWith('/') ? '' : '/'}${att.photo_url}`}
                        className="w-full h-full object-cover"
                        alt={`Attachment ${idx + 1}`}
                      />
                    </div>
                    <div className="p-2 border-t border-border">
                      <input
                        value={att.description || ''}
                        onChange={e => updateAttachmentDescription(idx, e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-border rounded bg-transparent focus:ring-1 focus:ring-primary outline-none"
                        placeholder="Keterangan foto..."
                      />
                    </div>
                  </div>
                ))}
                {(formData.attachments || []).length === 0 && (
                  <div className="col-span-1 md:col-span-3 py-8 flex flex-col items-center justify-center text-text-secondary border-2 border-dashed border-border rounded-xl bg-gray-50/50">
                    <p className="text-xs italic">Belum ada lampiran tambahan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Signature & Final Confirmation */}
        {currentStep === 'signature' && (
          <div className="p-6 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">PENGESAHAN LAPORAN</h3>
              <p className="text-text-secondary text-sm">Bubuhkan tanda tangan sesuai jabatan yang berwenang</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Driver Signature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    1. Sopir / Pengirim
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => openMaximize('driver')} className="text-primary hover:text-primary/80" title="Maximize">
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => driverSigRef.current?.clear()} className="text-[10px] text-red-500 hover:underline font-bold">RESET</button>
                  </div>
                </div>
                <div className="border border-border rounded-xl bg-white overflow-hidden h-32 relative group">
                  <SignatureCanvas
                    ref={driverSigRef}
                    penColor='black'
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                </div>
                <p className="text-[10px] text-center text-text-secondary italic">Nama: {formData.driver_name || '...................'}</p>
              </div>

              {/* Warehouse Signature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    2. Gudang
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => openMaximize('warehouse')} className="text-primary hover:text-primary/80" title="Maximize">
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => warehouseSigRef.current?.clear()} className="text-[10px] text-red-500 hover:underline font-bold">RESET</button>
                  </div>
                </div>
                <div className="border border-border rounded-xl bg-white overflow-hidden h-32 relative group">
                  <SignatureCanvas
                    ref={warehouseSigRef}
                    penColor='black'
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                </div>
                <p className="text-[10px] text-center text-text-secondary italic">Bagian Gudang</p>
              </div>

              {/* QC Signature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    3. QC Incoming
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => openMaximize('checker')} className="text-primary hover:text-primary/80" title="Maximize">
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => checkerSigRef.current?.clear()} className="text-[10px] text-red-500 hover:underline font-bold">RESET</button>
                  </div>
                </div>
                <div className="border border-border rounded-xl bg-white overflow-hidden h-32 relative group">
                  <SignatureCanvas
                    ref={checkerSigRef}
                    penColor='black'
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                </div>
                <p className="text-[10px] text-center text-text-secondary italic">Pemeriksa: {user?.name}</p>
              </div>

              {/* Supervisor Signature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    4. SPV QAQC
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => openMaximize('supervisor')} className="text-primary hover:text-primary/80" title="Maximize">
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => supervisorSigRef.current?.clear()} className="text-[10px] text-red-500 hover:underline font-bold">RESET</button>
                  </div>
                </div>
                <div className="border border-border rounded-xl bg-white overflow-hidden h-32 relative group">
                  <SignatureCanvas
                    ref={supervisorSigRef}
                    penColor='black'
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                </div>
                <p className="text-[10px] text-center text-text-secondary italic">Pemberi Persetujuan</p>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <label className="text-sm font-bold text-text-primary block mb-2">Catatan Tambahan (Opsional)</label>
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={e => updateFormData({ notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-primary/20"
                placeholder="Tulis kendala atau informasi tambahan di sini..."
              />
            </div>
          </div>
        )}

        {/* Form Actions (Next/Prev) */}
        <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep !== 'vehicle' && (
              <button
                onClick={() => {
                  const idx = steps.findIndex(s => s.id === currentStep);
                  prevStep(steps[idx-1].id as FormStep);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border font-bold text-text-primary hover:bg-surface transition-all"
              >
                <ChevronLeft className="w-5 h-5" /> Kembali
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-all disabled:opacity-50"
            >
              <FileSignature className="w-5 h-5" /> Simpan Draft
            </button>
            {currentStep !== 'signature' ? (
              <button
                onClick={() => {
                  const idx = steps.findIndex(s => s.id === currentStep);
                  nextStep(steps[idx+1].id as FormStep);
                }}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                Lanjut <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-10 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-md shadow-green-600/20 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : (
                  <>
                    <Save className="w-5 h-5" /> Selesaikan Inspeksi
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Maximized Signature Modal */}
      {maximizedSig && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-full max-h-[80vh] bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 md:p-6 bg-gray-50 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3 text-primary">
                <FileSignature className="w-6 h-6" />
                <h3 className="text-lg font-bold uppercase tracking-tight">
                  Tanda Tangan: {
                    maximizedSig === 'driver' ? 'Sopir' :
                    maximizedSig === 'checker' ? 'QC Incoming' :
                    maximizedSig === 'warehouse' ? 'Gudang' : 'SPV QAQC'
                  }
                </h3>
              </div>
              <button
                onClick={() => setMaximizedSig(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 bg-white relative">
              <SignatureCanvas
                ref={modalSigRef}
                penColor='black'
                canvasProps={{
                  className: 'w-full h-full cursor-crosshair',
                  style: { width: '100%', height: '100%' }
                }}
              />
              <div className="absolute bottom-6 left-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none">
                Area Tanda Tangan Luas
              </div>
            </div>

            <div className="p-4 md:p-8 bg-gray-50 border-t border-border flex items-center justify-center gap-4">
              <button
                onClick={() => modalSigRef.current?.clear()}
                className="px-8 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all uppercase text-sm tracking-widest"
              >
                Reset
              </button>
              <button
                onClick={saveMaximized}
                className="px-12 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 uppercase text-sm tracking-widest flex items-center gap-2"
              >
                <Save className="w-5 h-5" /> Simpan & Terapkan
              </button>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-6 font-medium italic">Gunakan jari atau stylus untuk hasil tanda tangan yang lebih baik</p>
        </div>
      )}
    </div>
  );
}
