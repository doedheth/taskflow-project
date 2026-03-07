/**
 * Inspection List Page
 *
 * Dashboard for Incoming Material Inspection System
 */

import { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Calendar,
  FileText,
  Search,
  Eye,
  Printer,
  Edit2,
  Trash2,
  Download
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';

import { useInspectionList } from '@/hooks/useInspection';
import { useComplaintsByInspection } from '@/hooks/useComplaint';
import { InspectionWithDetails, InspectionStatus } from '@/types/inspection';
import { generateInspectionPDF } from '@/utils/inspectionPdf';
import { inspectionAPI } from '@/services/api';
import logoHeader from '@/images/lgo-header.png';

import AGGridWrapper, { ColDef, GridApi } from '@/components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';

export default function InspectionList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const gridApiRef = useRef<GridApi | null>(null);

  // Popup state
  const [selectedBatchList, setSelectedBatchList] = useState<{ title: string; batches: string[]; unit?: string } | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Queries
  const { data: listData, isLoading } = useInspectionList({
    search: searchTerm,
    status: (selectedStatus as InspectionStatus) || undefined,
    date_from: dateRange.from,
    date_to: dateRange.to,
  });

  const inspections: InspectionWithDetails[] = Array.isArray(listData)
    ? listData
    : listData?.data || [];

  const ComplaintsCell = ({ id }: { id: number }) => {
    const { data, isLoading } = useComplaintsByInspection(id, true);
    const count = Array.isArray(data) ? data.length : 0;
    if (isLoading) {
      return <span className="text-[11px] text-text-secondary">...</span>;
    }
    if (count > 0) {
      const firstId = (data as any)[0]?.id;
      return (
        <Link
          to={firstId ? `/incoming-inspection/${id}/complaint/${firstId}` : `/incoming-inspection/${id}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] font-bold"
          title="Lihat komplain terkait inspeksi ini"
          onClick={(e) => e.stopPropagation()}
        >
          Komplain <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px]">{count}</span>
        </Link>
      );
    }
    return <span className="text-[11px] italic text-text-secondary">-</span>;
  };

  const columnDefs = useMemo<ColDef<InspectionWithDetails>[]>(() => [
    {
      headerName: 'No. Inspeksi',
      field: 'inspection_no',
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;
        return (
          <Link
            to={`/incoming-inspection/${params.data.id}`}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            {params.data.inspection_no}
          </Link>
        );
      },
    },
    {
      headerName: 'Komplain',
      field: 'id',
      minWidth: 110,
      maxWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;
        return <ComplaintsCell id={params.data.id} />;
      },
    },
    {
      headerName: 'Tanggal',
      field: 'inspection_date',
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;
        return (
          <span className="text-xs text-text-secondary">
            {format(new Date(params.data.inspection_date), 'dd MMM yyyy', { locale: localeId })}
          </span>
        );
      },
    },
    {
      headerName: 'Produsen',
      field: 'producer_name',
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;
        const producerName = params.data.producer_name || params.data.nama_produsen || '-';
        return (
          <div className="text-sm font-medium text-text-primary">
            {producerName}
          </div>
        );
      },
    },
    {
      headerName: 'Material',
      field: 'material_name',
      minWidth: 250,
      valueGetter: (params: any) => params.data?.material_name || params.data?.item_name || '-',
    },
    {
      headerName: 'No. Batch',
      field: 'batch_numbers',
      minWidth: 180,
      cellStyle: { overflow: 'visible' }, // Ensure tooltip is not clipped
      valueGetter: (params: any) => params.data?.batch_numbers || '-',
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data?.batch_numbers) return <span className="text-text-secondary italic">-</span>;

        const batches = params.data.batch_numbers.split(', ');

        if (batches.length === 0) return <span className="text-text-secondary italic">-</span>;

        // Parse first batch to separate number and qty
        const firstBatchParts = batches[0].split(':');
        const firstBatchNo = firstBatchParts[0];
        const firstBatchQty = firstBatchParts[1] || '';

        // Display style
        return (
          <div className="flex items-center gap-2 h-full">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-mono font-medium text-text-primary truncate max-w-[140px]" title={`${firstBatchNo} (${firstBatchQty})`}>
              <span>{firstBatchNo}</span>
              {firstBatchQty && <span className="text-[10px] text-text-secondary font-sans border-l border-border pl-1 ml-1">{firstBatchQty}</span>}
            </div>
            {batches.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBatchList({
                    title: `Batch No. - ${params.data?.inspection_no}`,
                    batches: batches,
                    unit: params.data?.packaging_unit || 'Unit'
                  });
                }}
                className="px-1.5 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-[10px] font-bold text-primary whitespace-nowrap transition-colors"
                title="Klik untuk lihat semua batch"
              >
                +{batches.length - 1}
              </button>
            )}
          </div>
        );
      }
    },
    {
      headerName: 'Qty Kedatangan',
      field: 'total_arrival_qty',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;
        return (
          <span className="text-sm font-bold text-primary">
            {params.data.total_arrival_qty || 0} <span className="text-[10px] font-normal text-text-secondary uppercase">{params.data.packaging_unit}</span>
          </span>
        );
      },
    },
    {
      headerName: 'Qty Penerimaan',
      field: 'total_received_qty',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;
        return (
          <span className="text-sm font-bold text-green-600">
            {params.data.total_received_qty || 0} <span className="text-[10px] font-normal text-text-secondary uppercase">{params.data.packaging_unit}</span>
          </span>
        );
      },
    },
    {
      headerName: 'Status',
      field: 'status',
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;
        const status = params.data.status;
        const colors = {
          pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      headerName: 'Aksi',
      field: 'id',
      minWidth: 160,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<InspectionWithDetails>) => {
        if (!params.data) return null;

        const handlePrint = async (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          try {
            toast.loading('Mempersiapkan PDF...', { id: 'pdf' });
            const response = await inspectionAPI.getById(params.data!.id);
            const detail = response.data.data || response.data;
            generateInspectionPDF(detail);
            toast.success('PDF berhasil dibuat', { id: 'pdf' });
          } catch (error) {
            console.error('Print error:', error);
            toast.error('Gagal membuat PDF', { id: 'pdf' });
          }
        };

        const handleDelete = async (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          if (confirm('Apakah Anda yakin ingin menghapus data inspeksi ini?')) {
            try {
              await inspectionAPI.delete(params.data!.id);
              toast.success('Data inspeksi berhasil dihapus');
              queryClient.invalidateQueries({ queryKey: ['inspections'] });
            } catch (error) {
              console.error('Delete error:', error);
              toast.error('Gagal menghapus data inspeksi');
            }
          }
        };

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/incoming-inspection/${params.data!.id}`)}
              className="p-1.5 hover:bg-surface-elevated rounded text-text-secondary transition-colors"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/incoming-inspection/${params.data!.id}/edit`)}
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
              title="Edit Data"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-surface-elevated rounded text-text-secondary transition-colors"
              title="Cetak PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
              title="Hapus Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ], [navigate, queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoHeader} alt="Logo" className="h-10 w-auto opacity-80" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">Inspeksi Material Masuk</h1>
            <p className="text-xs text-text-secondary mt-1">Pencatatan dan pemantauan inspeksi bahan baku</p>
          </div>
        </div>
        <Link
          to="/incoming-inspection/new"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Inspeksi Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-elevated p-4 rounded-xl border border-border flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary">{inspections.length}</div>
            <div className="text-xs text-text-secondary">Total Inspeksi</div>
          </div>
        </div>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Cari No. Inspeksi, PO, Supplier, Batch, atau Kode Lot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-border rounded-lg bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="pl-9 pr-3 py-1.5 border border-border rounded-lg bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <span className="text-text-secondary text-xs">s/d</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="pl-9 pr-3 py-1.5 border border-border rounded-lg bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => {
              if (gridApiRef.current) {
                gridApiRef.current.exportDataAsCsv({
                  fileName: `inspeksi-material-${dateRange.from}-to-${dateRange.to}.csv`,
                  allColumns: true
                });
              } else {
                toast.error('Gagal mengekspor data: Grid belum siap');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <AGGridWrapper<InspectionWithDetails>
        rowData={inspections}
        columnDefs={columnDefs}
        loading={isLoading}
        height={600}
        rowHeight={34}
        headerHeight={34}
        className="text-xs"
        emptyMessage="Belum ada data inspeksi"
        onGridReady={(params) => {
          gridApiRef.current = params.api;
        }}
      />

      {/* Batch List Modal */}
      {selectedBatchList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-elevated rounded-xl shadow-2xl w-full max-w-md border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
              <h3 className="font-bold text-text-primary">{selectedBatchList.title}</h3>
              <button
                onClick={() => setSelectedBatchList(null)}
                className="p-1 hover:bg-surface-hover rounded-full text-text-secondary transition-colors"
              >
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {selectedBatchList.batches.map((batchStr, idx) => {
                  const parts = batchStr.split(':');
                  const batchNo = parts[0];
                  const qty = parts[1] || '0';
                  // Get packaging unit from the selected row data (we need to pass it or find it)
                  // Ideally we pass it when setting selectedBatchList, but for now we can infer or leave it generic
                  // Better approach: Update selectedBatchList state to include unit

                  return (
                    <div key={idx} className="p-3 bg-surface rounded-lg border border-border flex items-center justify-between group hover:border-primary/50 transition-colors">
                      <div>
                        <div className="text-[10px] text-text-secondary mb-0.5">No. Batch</div>
                        <span className="font-mono text-sm font-bold text-text-primary">{batchNo}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-text-secondary mb-0.5">Qty ({selectedBatchList.unit || 'Unit'})</div>
                        <span className="font-mono text-sm font-medium text-primary bg-primary/5 px-2 py-1 rounded">
                          {parseFloat(qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-border bg-surface flex justify-end">
              <button
                onClick={() => setSelectedBatchList(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
