/**
 * SPK List Page
 *
 * Dashboard view for SPK (Surat Perintah Kerja) management
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AGGridWrapper, { ColDef } from '@/components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';
import {
  Plus,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Eye,
  Edit,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { useSPKList, useSPKDashboard, useApproveSPK, useRejectSPK } from '@/hooks/useSPK';
import { assetsAPI } from '@/services/api';
import SPKStatusBadge from '@/components/SPK/SPKStatusBadge';
import { SPKHeaderWithDetails, SPKStatus, Asset } from '@/types';
import toast from 'react-hot-toast';

export default function SPKList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Filter state
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Load assets
  useEffect(() => {
    assetsAPI.getAll().then((res) => {
      setAssets(res.data?.data || res.data || []);
    });
  }, []);

  // Queries
  const { data: listData, isLoading, refetch } = useSPKList({
    production_date: selectedDate,
    asset_id: selectedAsset ? parseInt(selectedAsset) : undefined,
    status: selectedStatus as SPKStatus || undefined,
  });

  const { data: dashboardData } = useSPKDashboard(selectedDate);

  // Mutations
  const approveMutation = useApproveSPK();
  const rejectMutation = useRejectSPK();

  const spkList: SPKHeaderWithDetails[] = Array.isArray(listData?.data)
    ? listData.data
    : listData?.data?.data || [];

  const dashboard = dashboardData?.data;

  const columnDefs = useMemo<ColDef<SPKHeaderWithDetails>[]>(() => [
    {
      headerName: 'No. SPK',
      field: 'spk_number',
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<SPKHeaderWithDetails>) => {
        if (!params.data) return null;
        return (
          <Link
            to={`/spk/${params.data.id}`}
            className="font-medium text-primary hover:underline"
          >
            {params.data.spk_number}
          </Link>
        );
      },
    },
    {
      headerName: 'Tanggal',
      field: 'production_date',
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams<SPKHeaderWithDetails>) => {
        if (!params.data) return null;
        return (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {format(new Date(params.data.production_date), 'dd MMM yyyy', { locale: localeId })}
          </span>
        );
      },
    },
    {
      headerName: 'Mesin',
      field: 'asset_code',
      minWidth: 180,
      cellRenderer: (params: ICellRendererParams<SPKHeaderWithDetails>) => {
        if (!params.data) return null;
        return (
          <div>
            <div className="font-medium" style={{ color: 'var(--color-text)' }}>{params.data.asset_code}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{params.data.asset_name}</div>
          </div>
        );
      },
    },
    {
      headerName: 'Status',
      field: 'status',
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams<SPKHeaderWithDetails>) => {
        if (!params.data) return null;
        return <SPKStatusBadge status={params.data.status} />;
      },
    },
    {
      headerName: 'Items',
      field: 'line_items_count',
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<SPKHeaderWithDetails>) => {
        if (!params.data) return null;
        return (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {params.data.line_items_count || 0} item
          </span>
        );
      },
    },
    {
      headerName: 'Dibuat Oleh',
      field: 'created_by_name',
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams<SPKHeaderWithDetails>) => {
        if (!params.data) return null;
        return (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {params.data.created_by_name}
          </span>
        );
      },
    },
    {
      headerName: 'Aksi',
      field: 'id',
      minWidth: 180,
      maxWidth: 200,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<SPKHeaderWithDetails>) => {
        if (!params.data) return null;
        const spk = params.data;
        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/spk/${spk.id}`}
              className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            </Link>

            {spk.status === 'draft' && (
              <Link
                to={`/spk/${spk.id}/edit`}
                className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </Link>
            )}

            {spk.status === 'pending' && isManagerOrAdmin && (
              <>
                <button
                  onClick={() => handleApprove(spk.id)}
                  className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={() => openRejectModal(spk.id)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                </button>
              </>
            )}

            <button
              onClick={() => navigate(`/spk/${spk.id}?print=true`)}
              className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded"
              title="Print"
            >
              <Printer className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            <button
              onClick={() => navigate(`/spk/new?duplicate=${spk.id}`)}
              className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded"
              title="Duplikat"
            >
              <Copy className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        );
      },
    },
  ], [isManagerOrAdmin, navigate]);

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('SPK berhasil di-approve');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal approve SPK');
    }
  };

  const openRejectModal = (id: number) => {
    setRejectingId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: rejectingId, rejection_reason: rejectionReason });
      toast.success('SPK ditolak');
      setRejectModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal reject SPK');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Surat Perintah Kerja (SPK)</h1>
          <p className="text-text-secondary mt-1">Kelola jadwal produksi dan SPK</p>
        </div>
        <Link
          to="/spk/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat SPK
        </Link>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{dashboard.total}</div>
                <div className="text-xs text-text-secondary">Total SPK</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{dashboard.pending}</div>
                <div className="text-xs text-text-secondary">Pending</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dashboard.approved}</div>
                <div className="text-xs text-text-secondary">Approved</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{dashboard.rejected}</div>
                <div className="text-xs text-text-secondary">Rejected</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{dashboard.draft}</div>
                <div className="text-xs text-text-secondary">Draft</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-500">{dashboard.cancelled}</div>
                <div className="text-xs text-text-secondary">Cancelled</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-elevated rounded-lg p-4 border border-border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Semua Mesin</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_code} - {asset.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* SPK Table */}
      <AGGridWrapper<SPKHeaderWithDetails>
        rowData={spkList}
        columnDefs={columnDefs}
        loading={isLoading}
        height={500}
        emptyMessage="Tidak ada SPK untuk tanggal ini"
      />

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
    </div>
  );
}
