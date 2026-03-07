/**
 * SPK Detail Page
 *
 * View SPK details and perform approval actions
 */

import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Printer,
  Copy,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import {
  useSPK,
  useSubmitSPK,
  useApproveSPK,
  useRejectSPK,
  useCancelSPK,
  useRevertSPKToDraft,
  useDeleteSPK,
} from '@/hooks/useSPK';
import SPKStatusBadge from '@/components/SPK/SPKStatusBadge';
import toast from 'react-hot-toast';

export default function SPKDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const printMode = searchParams.get('print') === 'true';

  // State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Query
  const { data: spkData, isLoading, refetch } = useSPK(parseInt(id!));

  // Mutations
  const submitMutation = useSubmitSPK();
  const approveMutation = useApproveSPK();
  const rejectMutation = useRejectSPK();
  const cancelMutation = useCancelSPK();
  const revertMutation = useRevertSPKToDraft();
  const deleteMutation = useDeleteSPK();

  const spk = spkData?.data;
  const isOwner = spk?.created_by === user?.id;
  const canEdit = spk?.status === 'draft' && (isOwner || isManagerOrAdmin);
  const canSubmit = spk?.status === 'draft' && (isOwner || isManagerOrAdmin);
  const canApprove = spk?.status === 'pending' && isManagerOrAdmin;
  const canRevert = spk?.status === 'rejected' && (isOwner || isManagerOrAdmin);
  const canCancel = ['draft', 'approved'].includes(spk?.status || '') && (isOwner || isManagerOrAdmin);

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(parseInt(id!));
      toast.success('SPK berhasil disubmit untuk approval');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal submit SPK');
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(parseInt(id!));
      toast.success('SPK berhasil di-approve');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal approve SPK');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: parseInt(id!), rejection_reason: rejectionReason });
      toast.success('SPK ditolak');
      setRejectModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal reject SPK');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(parseInt(id!));
      toast.success('SPK dibatalkan');
      setCancelModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal membatalkan SPK');
    }
  };

  const handleRevert = async () => {
    try {
      await revertMutation.mutateAsync(parseInt(id!));
      toast.success('SPK dikembalikan ke draft');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal mengembalikan SPK ke draft');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Memuat data...</div>
      </div>
    );
  }

  if (!spk) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <p className="text-text-secondary">SPK tidak ditemukan</p>
        <button
          onClick={() => navigate('/spk')}
          className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
        >
          Kembali ke Daftar SPK
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header - hide on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/spk')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{spk.spk_number}</h1>
              <SPKStatusBadge status={spk.status} />
            </div>
            <p className="text-text-secondary mt-1">
              Tanggal Produksi: {format(new Date(spk.production_date), 'EEEE, dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/spk/${id}/edit`)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}

          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Submit
            </button>
          )}

          {canApprove && (
            <>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {canRevert && (
            <button
              onClick={handleRevert}
              disabled={revertMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Edit Ulang
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={() => navigate(`/spk/new?duplicate=${id}`)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Copy className="w-4 h-4" />
            Duplikat
          </button>

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Batalkan
            </button>
          )}
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">SURAT PERINTAH KERJA</h1>
        <p className="text-sm">JADWAL PRODUKSI SCREW CAP</p>
        <p className="text-sm mt-2">No: {spk.spk_number}</p>
      </div>

      {/* Rejection Reason */}
      {spk.status === 'rejected' && spk.rejection_reason && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-300">SPK Ditolak</h4>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{spk.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* SPK Info */}
      <div className="bg-surface-elevated rounded-lg border border-border p-6 print:border-0 print:p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:grid-cols-4">
          <div>
            <div className="text-xs text-text-secondary uppercase mb-1">Mesin</div>
            <div className="font-medium">{spk.asset_code}</div>
            <div className="text-sm text-text-secondary">{spk.asset_name}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase mb-1">Tanggal Produksi</div>
            <div className="font-medium">
              {format(new Date(spk.production_date), 'dd MMM yyyy', { locale: localeId })}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase mb-1">Dibuat Oleh</div>
            <div className="font-medium">{spk.created_by_name}</div>
            <div className="text-sm text-text-secondary">
              {spk.created_at && format(new Date(spk.created_at), 'dd MMM yyyy HH:mm')}
            </div>
          </div>
          {spk.approved_by_name && (
            <div>
              <div className="text-xs text-text-secondary uppercase mb-1">Disetujui Oleh</div>
              <div className="font-medium">{spk.approved_by_name}</div>
              <div className="text-sm text-text-secondary">
                {spk.approved_at && format(new Date(spk.approved_at), 'dd MMM yyyy HH:mm')}
              </div>
            </div>
          )}
        </div>

        {spk.notes && (
          <div className="mb-6">
            <div className="text-xs text-text-secondary uppercase mb-1">Catatan</div>
            <div className="text-sm">{spk.notes}</div>
          </div>
        )}

        {/* Line Items Table */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4 print:text-base">Item Produk</h3>
          <div className="border border-border rounded-lg overflow-hidden print:border-black">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 print:bg-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase w-12 print:text-black">
                    No
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase print:text-black">
                    Kode Produk
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase print:text-black">
                    Nama Produk
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase print:text-black">
                    Material
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase w-20 print:text-black">
                    Berat (g)
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase w-24 print:text-black">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase w-24 print:text-black">
                    Kemasan
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase print:text-black">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-black">
                {spk.line_items?.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm text-text-secondary">{index + 1}</td>
                    <td className="px-3 py-2 text-sm font-medium">{item.product_code}</td>
                    <td className="px-3 py-2 text-sm">{item.product_name}</td>
                    <td className="px-3 py-2 text-sm text-text-secondary">{item.product_material || '-'}</td>
                    <td className="px-3 py-2 text-sm text-right">{item.product_weight_gram || '-'}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-sm">{item.packaging_type || '-'}</td>
                    <td className="px-3 py-2 text-sm text-text-secondary">{item.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8">
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <p className="text-sm">Dibuat Oleh,</p>
            <div className="h-16"></div>
            <p className="text-sm font-medium">{spk.created_by_name}</p>
            <p className="text-xs text-gray-600">PPIC</p>
          </div>
          <div className="text-center">
            <p className="text-sm">Diterima Oleh,</p>
            <div className="h-16"></div>
            <p className="text-sm font-medium">{spk.approved_by_name || '_______________'}</p>
            <p className="text-xs text-gray-600">Production Manager</p>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Tolak SPK</h3>
            <p className="text-sm text-text-secondary mb-4">
              Masukkan alasan penolakan SPK:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Alasan penolakan..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Memproses...' : 'Tolak SPK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Batalkan SPK</h3>
            <p className="text-sm text-text-secondary mb-4">
              Apakah Anda yakin ingin membatalkan SPK ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Tidak
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
