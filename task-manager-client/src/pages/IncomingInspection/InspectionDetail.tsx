/**
 * Inspection Detail Page
 *
 * View inspection details and generate PDF report
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Truck,
  Package,
  ShieldCheck,
  Scale,
  FileText,
  Camera,
  Edit2,
  Trash2,
  X,
  Search,
  Maximize2
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';

import { useInspection, useDeleteInspection } from '@/hooks/useInspection';
import { generateInspectionPDF } from '@/utils/inspectionPdf';
import logoHeader from '@/images/lgo-header.png';
import { ComplaintSection } from '@/components/Inspection/ComplaintSection';

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: inspection, isLoading } = useInspection(parseInt(id!));
  const deleteMutation = useDeleteInspection();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleDownloadPDF = () => {
    if (!inspection) return;
    generateInspectionPDF(inspection);
  };

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus data inspeksi ini?')) {
      try {
        await deleteMutation.mutateAsync(parseInt(id!));
        toast.success('Data inspeksi berhasil dihapus');
        navigate('/incoming-inspection');
      } catch (error) {
        toast.error('Gagal menghapus data inspeksi');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-text-secondary mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-text-primary">Inspeksi tidak ditemukan</h2>
        <button onClick={() => navigate('/incoming-inspection')} className="mt-4 text-primary hover:underline">
          Kembali ke daftar
        </button>
      </div>
    );
  }

  const SignatureBox = ({ label, signature, name }: { label: string, signature?: string | null, name?: string | null }) => (
    <div className="flex flex-col border border-black/10 rounded-xl overflow-hidden bg-white">
      <div className="bg-gray-50 py-1 px-2 border-b border-black/10 text-[9px] font-black uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      <div
        className="h-16 flex items-center justify-center p-2 cursor-zoom-in group relative"
        onClick={() => signature && setZoomedImage(signature)}
      >
        {signature ? (
          <>
            <img src={signature} alt={label} className="max-h-full max-w-full object-contain" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <Search className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        ) : (
          <span className="text-[9px] text-gray-300 italic">Belum ditandatangani</span>
        )}
      </div>
      <div className="py-1 px-2 border-t border-black/5 text-[9px] font-bold text-center truncate italic text-black/60">
        {name || '...................'}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full">
            <X className="w-8 h-8" />
          </button>
          <img
            src={zoomedImage}
            alt="Enlarged view"
            className="max-w-full max-h-[90vh] object-contain bg-white rounded-lg p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Control Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/incoming-inspection')}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={logoHeader} alt="Logo" className="h-10 w-auto opacity-80 hidden md:block" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary">{inspection.inspection_no}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                inspection.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {inspection.status}
              </span>
            </div>
            <p className="text-text-secondary text-xs">
              {format(new Date(inspection.inspection_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/incoming-inspection/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-dark-800 text-text-primary border border-border rounded-xl hover:bg-surface transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors font-bold uppercase text-xs tracking-widest disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-shadow shadow-lg shadow-primary/20 font-black uppercase text-xs tracking-widest"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Content: Metadata aligned with Handwritten Template */}
          <div className="bg-surface-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-b border-border flex items-center gap-2 text-primary">
              <Truck className="w-5 h-5" />
              <h3 className="font-bold text-text-primary uppercase text-sm">Informasi Kedatangan (FRM.QAQC.05.19.01)</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 border-b border-border">
              {/* Left Column (Handwritten image order) */}
              <div className="space-y-4">
                <InfoRow label="TANGGAL MASUK" value={inspection.inspection_date ? format(new Date(inspection.inspection_date), 'dd MMMM yyyy', { locale: localeId }) : '-'} />
                <InfoRow label="NAMA MATERIAL" value={(inspection as any).material_name || inspection.item_name} />
                <InfoRow label="NAMA SUPPLIER" value={inspection.supplier_name} />
                <InfoRow label="NO. SURAT JALAN" value={inspection.surat_jalan_no} />
                <InfoRow label="PABRIK DANONE" value={inspection.pabrik_danone} />
              </div>
              {/* Right Column (Handwritten image order) */}
              <div className="space-y-4">
                <InfoRow label="NO. PO" value={inspection.po_no} />
                <InfoRow label="KODE PRODUKSI" value={inspection.kode_produksi} />
                <InfoRow label="NAMA EXPEDISI" value={inspection.expedition_name} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="NO. KENDARAAN" value={inspection.vehicle_no} />
                  <InfoRow label="JENIS KENDARAAN" value={inspection.vehicle_type} />
                </div>
                <InfoRow label="JENIS BAK" value={inspection.vehicle_cover_type} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="EXPIRED DATE" value={inspection.expired_date} />
                  <InfoRow label="NO SEAL" value={inspection.no_seal} />
                </div>
              </div>
            </div>

            {/* Tabel Ringkasan Kedatangan (10 Baris Pertama) */}
            <div className="px-6 pb-6">
              <div className="border-2 border-black overflow-hidden rounded-lg">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-black text-white font-black text-center uppercase tracking-widest">
                      <tr className="divide-x-2 divide-white/20">
                      <th className="py-2 w-10">No</th>
                      <th className="px-3">No. Batch</th>
                      <th className="px-3">Expired Date</th>
                      <th className="px-3 py-2 w-24">Jml Kemasan ({inspection.packaging_unit || 'UNIT'})</th>
                      <th className="px-3 w-24">Isi Per Kemasan ({inspection.measure_unit || 'KG'})</th>
                      <th className="px-3 w-32">Total ({inspection.measure_unit || 'KG'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {inspection.items?.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="divide-x-2 divide-black/10 font-bold">
                        <td className="py-1.5 text-center bg-gray-50">{idx + 1}</td>
                        <td className="px-3">
                          <div>{item.batch_no || '-'}</div>
                          {item.lot_code && (
                            <div className="text-[9px] text-primary font-mono">[{item.lot_code}]</div>
                          )}
                        </td>
                        <td className="px-3 text-center">{item.expired_date || '-'}</td>
                        <td className="px-3 text-right">{item.qty || 0}</td>
                        <td className="px-3 text-right">{item.weight_per_unit || 0}</td>
                        <td className="px-3 text-right text-primary font-black">
                          {((Number(item.qty) || 0) * (Number(item.weight_per_unit) || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-black font-black">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-right uppercase text-[9px]">Total ({inspection.measure_unit || 'KG'})</td>
                      <td className="px-4 py-2 text-right text-lg text-primary decoration-double underline">
                        {inspection.items?.slice(0, 10).reduce((acc, curr) => acc + ((Number(curr.qty) || 0) * (Number(curr.weight_per_unit) || 0)), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Signature Row for Arrival Section */}
            <div className="p-4 bg-gray-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
              <SignatureBox label="Sopir" signature={inspection.driver_signature} name={inspection.driver_name} />
              <SignatureBox label="QC Incoming" signature={inspection.checker_signature} name={inspection.checker_name} />
              <SignatureBox label="Gudang" signature={inspection.warehouse_signature} name="Bagian Gudang" />
            </div>
          </div>

          {/* Producer & Food Safety Meta (From SQP Template) */}
          <div className="bg-surface-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-b border-border flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary uppercase text-sm">Detail Produsen & Keamanan Pangan</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <InfoRow label="Nama Produsen" value={(inspection as any).producer_name || inspection.nama_produsen} />
              <InfoRow label="Negara Produsen" value={inspection.negara_produsen} />
              <InfoRow label="Logo Halal" value={inspection.logo_halal} />
              <div className="space-y-1">
                <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Waktu Bongkar</div>
                <div className="text-md font-bold text-text-primary italic">{inspection.unloading_start_time || '--:--'} s/d {inspection.unloading_end_time || '--:--'}</div>
              </div>
            </div>
          </div>

          {/* QC Scores & Decision */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">SCORE KUALITAS</span>
              <span className="text-2xl font-black text-green-600">{inspection.qc_params?.qc_score || 0}%</span>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase">SCORE KEAMANAN</span>
              <span className="text-2xl font-black text-orange-600">{inspection.qc_params?.fs_score || 0}%</span>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-primary uppercase">KEPUTUSAN</span>
              <span className="text-lg font-black text-primary uppercase">{inspection.qc_params?.decision || '-'}</span>
            </div>
          </div>

          {/* Detailed QC Checklist Section (Mirroring PDF Page 3) */}
          <div className="bg-surface-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-text-primary uppercase text-sm">Hasil Pemeriksaan QC (FRM.QAQC.05.01.03)</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-text-secondary border-b border-border">
                  <tr>
                    <th className="px-4 py-3 w-16">No</th>
                    <th className="px-4 py-3">Item Pengecekan</th>
                    <th className="px-4 py-3 hidden md:table-cell">Standar / Spesifikasi</th>
                    <th className="px-4 py-3 text-center w-12 border-l border-border">Ac</th>
                    <th className="px-4 py-3 text-center w-12 border-l border-border">Re</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Category I: Kualitas */}
                  <tr className="bg-primary/5">
                    <td colSpan={5} className="px-4 py-2 font-black text-primary text-[10px] uppercase tracking-widest">I. KUALITAS</td>
                  </tr>
                  {[
                    { no: '1', label: 'Berat', std: 'Sesuai standart di ITP', field: 'q_berat' },
                    { no: '2.a', label: 'Fungsional: Joint', std: 'Las merekat kuat, joint gap 3-9mm', field: 'q_joint' },
                    { no: '2.b', label: 'Fungsional: Creasing', std: 'Mudah dilipat dan tidak pecah', field: 'q_creasing' },
                    { no: '3.a', label: 'CoA: Panjang', std: 'Sesuai dimensi ITP', field: 'q_coa_panjang' },
                    { no: '3.b', label: 'CoA: Lebar', std: 'Sesuai dimensi ITP', field: 'q_coa_lebar' },
                    { no: '3.c', label: 'CoA: Tinggi', std: 'Sesuai dimensi ITP', field: 'q_coa_tinggi' },
                    { no: '3.d', label: 'CoA: Tebal', std: 'Sesuai Micrometer/Caliper', field: 'q_coa_tebal' },
                    { no: '3.e', label: 'CoA: BCT', std: 'Compression Test', field: 'q_coa_bct' },
                    { no: '3.f', label: 'CoA: Cobb Size', std: 'Water Absorption', field: 'q_coa_cobb' },
                    { no: '3.g', label: 'CoA: Bursting', std: 'Bursting Test', field: 'q_coa_bursting' },
                    { no: '3.h', label: 'CoA: Batch / Lot No', std: 'Sesuai CoA Vendor', field: 'q_coa_batch_lot' },
                    { no: '3.i', label: 'CoA: Color Chip', std: 'Sesuai Standar Pantone', field: 'q_coa_color_chip' },
                    { no: '4.a', label: 'Visual: Sobek / Cacat', std: 'Bebas kotoran & cacat produksi', field: 'q_visual_sobek' },
                    { no: '4.b', label: 'Visual: Cetakan', std: 'Tajam, register tepat (max 1mm)', field: 'q_visual_cetakan' },
                    { no: '4.c', label: 'Visual: Flutting', std: 'Tidak patah (max 2 titik)', field: 'q_visual_flutting' },
                    { no: '4.d', label: 'Visual: Packaging', std: 'Rapi, identitas jelas', field: 'q_visual_packaging' },
                    { no: '4.e', label: 'Visual: Warna', std: 'Sesuai Color Range', field: 'q_visual_warna' },
                    { no: '4.f', label: 'Visual: Clarity', std: 'Transparansi standar', field: 'q_visual_clarity' },
                  ].map((item) => (
                    <QCResultRow key={item.field} no={item.no} label={item.label} std={item.std} value={inspection.qc_params?.[item.field as keyof typeof inspection.qc_params]} />
                  ))}

                  {/* Category II: Keamanan Pangan */}
                  <tr className="bg-blue-50/50">
                    <td colSpan={5} className="px-4 py-2 font-black text-blue-700 text-[10px] uppercase tracking-widest">II. KEAMANAN PANGAN</td>
                  </tr>
                  {[
                    { no: '1.a', label: 'Material: Bersih', std: 'Kering, bebas serangga/olie', field: 'fs_mat_bersih' },
                    { no: '1.b', label: 'Material: Bau', std: 'Odorless / Bebas bau asing', field: 'fs_mat_bau' },
                    { no: '2.a', label: 'Kendaraan: Bersih', std: 'Bebas debu/kotoran/oli', field: 'fs_veh_bersih' },
                    { no: '2.b', label: 'Kendaraan: Bau', std: 'Bak tidak berbau kontaminan', field: 'fs_veh_bau' },
                    { no: '2.c', label: 'Kendaraan: Kondisi Bak', std: 'Tertutup & terkunci', field: 'fs_veh_bak' },
                    { no: '2.d', label: 'Kendaraan: Segel', std: 'Utuh, sesuai surat jalan', field: 'fs_veh_segel' },
                  ].map((item) => (
                    <QCResultRow key={item.field} no={item.no} label={item.label} std={item.std} value={inspection.qc_params?.[item.field as keyof typeof inspection.qc_params]} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase text-text-secondary">Keputusan Final:</span>
                <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  inspection.qc_params?.decision === 'Di terima' ? 'bg-green-100 text-green-700' :
                  inspection.qc_params?.decision === 'Rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {inspection.qc_params?.decision || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Packaging & Sampling Section (Handwritten Style) */}
          <div className="bg-surface-elevated rounded-2xl border-2 border-black shadow-sm overflow-hidden bg-white text-black">
            <div className="p-4 bg-black text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              <h3 className="font-black uppercase text-sm tracking-widest">1. Pemeriksaan Kemasan & Kuantitas</h3>
            </div>

            <div className="p-6 space-y-8">
              {/* Packaging Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-black flex flex-col">
                  <div className="bg-black text-white text-center py-1 text-[9px] font-black uppercase">KONDISI KEMASAN</div>
                  <div className="flex-1 flex items-center justify-center p-3 text-sm font-black bg-gray-50">{inspection.pkg_condition || '-'}</div>
                </div>
                <div className="border-2 border-black flex flex-col">
                  <div className="bg-black text-white text-center py-1 text-[9px] font-black uppercase">NAMA BARANG</div>
                  <div className="flex-1 flex items-center justify-center p-3 text-sm font-black bg-gray-50">{inspection.pkg_name_check || '-'}</div>
                </div>
                <div className="border-2 border-black flex flex-col">
                  <div className="bg-black text-white text-center py-1 text-[9px] font-black uppercase">LABEL BAHAYA</div>
                  <div className="flex-1 flex items-center justify-center p-3 text-sm font-black bg-gray-50">{inspection.pkg_hazard_label || '-'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-b-2 border-black/10 pb-4">
                <span className="text-[11px] font-black uppercase shrink-0">Catatan Kemasan :</span>
                <span className="text-sm font-bold italic text-primary">{inspection.packaging_notes || '-'}</span>
              </div>

              {/* Total Summary */}
              <div className="space-y-4">
                <div className="text-[11px] font-black uppercase text-black/40">2. PEMERIKSAAN JUMLAH BARANG :</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">A. TOTAL KEDATANGAN (Gross)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-primary underline decoration-2">{inspection.total_arrival_qty?.toLocaleString() || 0}</span>
                      <span className="text-sm font-black text-black/60 uppercase">{inspection.measure_unit || 'KG'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">B. TOTAL PENERIMAAN (Net - OK Only)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-green-600 underline decoration-2">{inspection.total_received_qty?.toLocaleString() || 0}</span>
                      <span className="text-sm font-black text-black/60 uppercase">{inspection.measure_unit || 'KG'}</span>
                    </div>
                  </div>
                </div>
                {inspection.total_items_received_text && (
                  <div className="pt-2 border-t border-black/5">
                    <span className="text-[10px] font-bold text-black/40 uppercase">Keterangan Tambahan: </span>
                    <span className="text-sm font-bold italic text-text-secondary">{inspection.total_items_received_text}</span>
                  </div>
                )}
              </div>

              {/* Sampling & Note Grid (Single Table + Big Note Box) */}
              <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-2">
                {/* Sampling Table (65%) - Single Table */}
                <div className="w-full lg:w-[65%] border-2 border-black overflow-hidden bg-white shadow-sm">
                  <div className="bg-black text-white text-center py-1.5 text-[10px] font-black uppercase tracking-widest">Hasil Sampling ({inspection.packaging_unit || 'UNIT'})</div>
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-gray-100 border-b-2 border-black font-black text-center">
                      <tr className="divide-x-2 divide-black uppercase text-[8px]">
                        <th className="w-8 py-2">No</th>
                        <th className="px-3">Batch</th>
                        <th className="px-3">Batch Vendor</th>
                        <th className="w-24 px-1">Berat Timbangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-bold">
                      {Array.from({ length: 20 }).map((_, idx) => {
                        const item = inspection.items?.[idx];
                        return (
                          <tr key={idx} className="divide-x-2 divide-black hover:bg-blue-50/20 transition-colors">
                            <td className="py-1.5 text-center bg-gray-50/50">{idx + 1}</td>
                            <td className="px-2 font-mono truncate max-w-[160px]">
                              <div className="truncate">{item?.batch_no || '-'}</div>
                              {item?.lot_code && (
                                <div className="text-[9px] text-primary truncate">[{item.lot_code}]</div>
                              )}
                            </td>
                            <td className="px-2 font-mono truncate max-w-[140px]">{(item as any)?.batch_vendor || '-'}</td>
                            <td className="px-1 text-right text-primary font-black">{(item as any)?.scale_weight ?? '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 text-black font-black border-t-4 border-black text-center">
                      <tr className="divide-x-2 divide-black">
                        <td colSpan={3} className="py-1.5 text-[9px] uppercase text-right pr-2">Total ({inspection.measure_unit || 'KG'})</td>
                        <td colSpan={2} className="text-primary text-right px-3">
                          {(inspection.items || []).reduce((acc, curr) => acc + (((Number(curr.qty) || 0) * (Number(curr.weight_per_unit) || 0))), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Notes area (35%) */}
                <div className="w-full lg:w-[35%] border-2 border-black flex flex-col bg-yellow-50/20 shadow-inner">
                  <div className="bg-black text-white text-center py-1.5 text-[10px] font-black uppercase tracking-widest">Catatan</div>
                  <div className="flex-1 p-6 text-sm font-black text-primary whitespace-pre-wrap leading-relaxed italic border-t border-black/5">
                    {inspection.notes || 'Tidak ada catatan rincian sampling'}
                  </div>
                </div>
              </div>

              {/* Signature Row for Packaging Section (Page 2 style) */}
              <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4 text-[11px] font-black uppercase">
                    <span>Mulai Bongkar :</span>
                    <span className="text-primary font-bold">{inspection.unloading_start_time || '-'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-black uppercase">
                    <span>Selesai Bongkar :</span>
                    <span className="text-primary font-bold">{inspection.unloading_end_time || '-'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SignatureBox label="Gudang" signature={inspection.warehouse_signature} name="Bagian Gudang" />
                  <SignatureBox label="Driver Expedisi" signature={inspection.driver_signature} name={inspection.driver_name} />
                </div>
              </div>
            </div>
          </div>

          {/* SPV Approval Section (Final Authority) */}
          <div className="bg-white rounded-2xl border-2 border-primary/20 shadow-sm overflow-hidden">
             <div className="p-4 bg-primary/5 flex items-center justify-between border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-black uppercase text-sm tracking-widest text-primary">Pengesahan Akhir (SPV QAQC)</h3>
                </div>
                <div className="text-[10px] font-bold text-primary/60 uppercase">Dokumen ISO Terverifikasi</div>
             </div>
             <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Laporan ini telah ditinjau dan disetujui secara digital oleh Supervisor QAQC sebagai keputusan final atas kelayakan material masuk.
                  </p>
                  <div className="flex gap-4 pt-2">
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Keputusan: {inspection.qc_params?.decision}</div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">QC: {inspection.qc_params?.qc_score}%</div>
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <SignatureBox label="Supervisor QAQC" signature={inspection.supervisor_signature} name="Supervisor QAQC" />
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Weights */}
          <div className="bg-surface-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-b border-border flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary">Data Timbangan</h3>
            </div>
            <div className="p-4 space-y-4">
              {inspection.weights?.map((w, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface">
                  {w.photo_url ? (
                    <div className="relative group cursor-zoom-in" onClick={() => setZoomedImage(w.photo_url)}>
                      <img
                        src={w.photo_url.startsWith('http') ? w.photo_url : `${window.location.origin}${w.photo_url.startsWith('/') ? '' : '/'}${w.photo_url}`}
                        className="w-12 h-12 rounded-lg object-cover border border-border shadow-sm group-hover:brightness-90 transition-all"
                        alt="Weight"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const backendUrl = `http://${window.location.hostname}:5555${w.photo_url!.startsWith('/') ? '' : '/'}${w.photo_url}`;
                          if (target.src !== backendUrl) {
                            target.src = backendUrl;
                          }
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Search className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-800 flex items-center justify-center text-text-secondary">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-text-secondary uppercase">Batch: {w.batch_no}</div>
                    <div className="text-lg font-bold text-text-primary">{w.weight} <span className="text-xs font-normal">KG</span></div>
                  </div>
                </div>
              ))}
              {(!inspection.weights || inspection.weights.length === 0) && (
                <div className="text-center py-4 text-xs text-text-secondary italic">Tidak ada data timbangan</div>
              )}
            </div>
          </div>

          {/* Document Attachments */}
          <div className="bg-surface-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-b border-border flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary">Lampiran Dokumen</h3>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: 'Surat Jalan', url: inspection.surat_jalan_photo_url },
                { label: 'TTB', url: inspection.ttb_photo_url },
                { label: 'COA', url: inspection.coa_photo_url },
              ].map((doc, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-[10px] font-bold text-text-secondary uppercase px-1">{doc.label}</div>
                  {doc.url ? (
                    <div
                      className="relative group cursor-zoom-in rounded-xl border border-border overflow-hidden bg-surface aspect-video"
                      onClick={() => setZoomedImage(doc.url!)}
                    >
                      <img
                        src={doc.url.startsWith('http') ? doc.url : `${window.location.origin}${doc.url.startsWith('/') ? '' : '/'}${doc.url}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        alt={doc.label}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const backendUrl = `http://${window.location.hostname}:5555${doc.url!.startsWith('/') ? '' : '/'}${doc.url}`;
                          if (target.src !== backendUrl) {
                            target.src = backendUrl;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-gray-50 dark:bg-dark-900/30 h-24 flex items-center justify-center text-[10px] text-text-secondary italic">
                      Tidak ada foto {doc.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Other Attachments (New Section) */}
          {inspection.attachments && inspection.attachments.length > 0 && (
            <div className="bg-surface-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-b border-border flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text-primary">Lampiran Lainnya</h3>
              </div>
              <div className="p-4 space-y-4">
                {inspection.attachments.map((att, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-[10px] font-bold text-text-secondary uppercase px-1">
                      {att.description || `Lampiran ${idx + 1}`}
                    </div>
                    <div
                      className="relative group cursor-zoom-in rounded-xl border border-border overflow-hidden bg-surface aspect-video"
                      onClick={() => setZoomedImage(att.photo_url)}
                    >
                      <img
                        src={att.photo_url.startsWith('http') ? att.photo_url : `${window.location.origin}${att.photo_url.startsWith('/') ? '' : '/'}${att.photo_url}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={att.description || `Attachment ${idx + 1}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const backendUrl = `http://${window.location.hostname}:5555${att.photo_url.startsWith('/') ? '' : '/'}${att.photo_url}`;
                          if (target.src !== backendUrl) {
                            target.src = backendUrl;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Complaint Section - Full Width below grid */}
      <ComplaintSection inspectionId={inspection.id} />
    </div>
  );
}

function InfoRow({ label, value, subValue }: { label: string; value?: string | number | null; subValue?: string | null }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{label}</div>
      <div className="text-sm font-bold text-text-primary underline decoration-black/10 decoration-2 underline-offset-4">{value || '-'}</div>
      {subValue && <div className="text-[10px] text-primary font-black mt-1 uppercase tracking-tighter">[{subValue}]</div>}
    </div>
  );
}

function QCResultRow({ no, label, std, value }: { no: string; label: string; std: string; value?: string | number | null }) {
  const numericValue = typeof value === 'string' ? parseInt(value) : value;
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-2.5 font-bold text-text-secondary">{no}</td>
      <td className="px-4 py-2.5 font-medium text-text-primary">{label}</td>
      <td className="px-4 py-2.5 text-text-secondary italic hidden md:table-cell">{std}</td>
      <td className="px-4 py-2.5 text-center border-l border-border">
        {numericValue === 1 ? (
          <span className="text-lg font-black text-primary">
            O
          </span>
        ) : null}
      </td>
      <td className="px-4 py-2.5 text-center border-l border-border">
        {numericValue === 2 ? (
          <span className="text-lg font-black text-red-600">
            O
          </span>
        ) : null}
      </td>
    </tr>
  );
}

