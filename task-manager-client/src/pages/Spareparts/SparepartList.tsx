import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AGGridWrapper, { ColDef } from '@/components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';
import { RefreshCw, Search, Clock, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import apiV2 from '@/services/api-v2';
import { SparepartComparison } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SparepartList() {
  const [data, setData] = useState<SparepartComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'diff' | 'bc-only' | 'cmms-only'>('all');

  // Track if a sync is already in progress to avoid stacking requests
  const isSyncingRef = useRef(false);

  const fetchData = useCallback(async (isManual: boolean = false) => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsLoading(true);

    try {
      // Call internal backend API
      const response = await apiV2.spareparts.getComparison();

      if (response.data?.success) {
        const comparisonData = response.data.data;
        setData(comparisonData);
        setLastSync(new Date());

        if (isManual) {
          toast.success(`Successfully synced ${comparisonData.length} items from server`);
        }
      } else {
        throw new Error(response.data?.error || 'Failed to fetch comparison data');
      }
    } catch (error: any) {
      console.error('Failed to sync spareparts:', error);
      toast.error(error.message || 'Failed to retrieve data from internal server');
    } finally {
      setIsLoading(false);
      isSyncingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle background sync every 10 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!searchQuery) {
        console.log('Running background sync for Sparepart Comparison...');
        fetchData();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchData, searchQuery]);

  // Pre-calculate statistics
  const stats = useMemo(() => {
    return {
      total: data.length,
      match: data.filter(i => i.is_match).length,
      mismatch: data.filter(i => !i.is_match).length,
      cmmsOnly: data.filter(i => !i.exists_in_bc).length,
    };
  }, [data]);

  // Filtering logic
  const filteredData = useMemo(() => {
    let result = data;

    if (filterMode === 'diff') {
      result = result.filter(item => !item.is_match);
    } else if (filterMode === 'bc-only') {
      result = result.filter(item => item.exists_in_bc && !item.exists_in_cmms);
    } else if (filterMode === 'cmms-only') {
      result = result.filter(item => !item.exists_in_bc && item.exists_in_cmms);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          (item.No && item.No.toLowerCase().includes(lowerQuery)) ||
          (item.Description && item.Description.toLowerCase().includes(lowerQuery))
      );
    }

    return result;
  }, [data, searchQuery, filterMode]);

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = ['Item No', 'Description', 'Stock BC', 'Stock CMMS', 'Diff', 'Status', 'System Source'];
    const csvRows = [
      headers.join(','),
      ...data.map(row => {
        let source = 'Both Systems';
        if (row.exists_in_bc && !row.exists_in_cmms) source = 'BC Only';
        if (!row.exists_in_bc && row.exists_in_cmms) source = 'CMMS Only';

        return [
          `"${row.No}"`,
          `"${row.Description.replace(/"/g, '""')}"`,
          row.InventoryCtrl,
          row.cmms_qty,
          row.diff,
          row.is_match ? 'MATCH' : 'MISMATCH',
          `"${source}"`
        ].join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Sparepart_Comparison_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columnDefs = useMemo<ColDef<SparepartComparison>[]>(() => [
    {
      headerName: 'Item No.',
      field: 'No',
      minWidth: 130,
      cellClass: 'text-[10px] font-mono',
      cellRenderer: (params: ICellRendererParams<SparepartComparison>) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {params.data?.No}
        </span>
      ),
    },
    {
      headerName: 'Description',
      field: 'Description',
      minWidth: 250,
      flex: 1,
      cellClass: 'text-[10px]',
      cellRenderer: (params: ICellRendererParams<SparepartComparison>) => {
        const item = params.data;
        if (!item) return null;
        return (
          <div className="flex flex-col leading-tight py-1">
            <span className="truncate font-medium">{item.Description}</span>
            {!item.exists_in_bc && <span className="text-[8px] text-orange-500 font-bold uppercase">Only in CMMS</span>}
            {!item.exists_in_cmms && <span className="text-[8px] text-blue-500 font-bold uppercase">Only in BC</span>}
          </div>
        );
      }
    },
    {
      headerName: 'Stock BC',
      field: 'InventoryCtrl',
      width: 90,
      cellClass: 'text-[10px] text-right',
      type: 'numericColumn',
      cellRenderer: (params: ICellRendererParams<SparepartComparison>) => (
        <span className={`font-bold ${params.data?.exists_in_bc ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
          {params.data?.InventoryCtrl?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      headerName: 'Stock CMMS',
      field: 'cmms_qty',
      width: 100,
      cellClass: 'text-[10px] text-right',
      type: 'numericColumn',
      cellRenderer: (params: ICellRendererParams<SparepartComparison>) => (
        <span className={`font-bold ${params.data?.exists_in_cmms ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
          {params.data?.cmms_qty?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      headerName: 'Diff',
      field: 'diff',
      width: 80,
      cellClass: 'text-[10px] text-right',
      type: 'numericColumn',
      cellRenderer: (params: ICellRendererParams<SparepartComparison>) => {
        const val = params.data?.diff || 0;
        if (params.data?.is_match) return <span className="text-gray-400">-</span>;
        return (
          <span className={`font-bold ${val > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString()}
          </span>
        );
      },
    },
    {
      headerName: 'Status',
      width: 100,
      cellClass: 'text-[10px]',
      cellRenderer: (params: ICellRendererParams<SparepartComparison>) => {
        if (!params.data) return null;
        if (params.data.is_match) {
          return (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">Match</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Mismatch</span>
          </div>
        );
      },
    },
    {
      headerName: 'Asset/Location (CMMS)',
      field: 'cmms_asset',
      minWidth: 200,
      cellClass: 'text-[10px]',
      cellRenderer: (params: ICellRendererParams<SparepartComparison>) => {
        const item = params.data;
        if (!item || (!item.cmms_asset && !item.cmms_location)) return '-';
        return (
          <div className="flex flex-col leading-tight py-1">
            <span className="truncate text-text-secondary">{item.cmms_asset || '-'}</span>
            <span className="text-[9px] text-gray-500 italic">{item.cmms_location || '-'}</span>
          </div>
        );
      }
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sparepart Stock Comparison</h1>
          <p className="text-text-secondary mt-1">Full cross-check between Business Central and CMMS inventory</p>
        </div>

        <div className="flex items-center gap-3">
          {lastSync && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface-elevated px-3 py-2 rounded-lg border border-border">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(lastSync, 'HH:mm:ss')}</span>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={isLoading || data.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface p-2.5 rounded-lg border border-border shadow-sm">
          <p className="text-[10px] text-text-secondary uppercase font-semibold">Total Items</p>
          <p className="text-lg font-bold">{stats.total}</p>
        </div>
        <div className="bg-surface p-2.5 rounded-lg border border-border shadow-sm">
          <p className="text-[10px] text-green-600 uppercase font-semibold">Synced/Match</p>
          <p className="text-lg font-bold text-green-600">{stats.match}</p>
        </div>
        <div className="bg-surface p-2.5 rounded-lg border border-border shadow-sm">
          <p className="text-[10px] text-red-600 uppercase font-semibold">Discrepancies</p>
          <p className="text-lg font-bold text-red-600">{stats.mismatch}</p>
        </div>
        <div className="bg-surface p-2.5 rounded-lg border border-border shadow-sm">
          <p className="text-[10px] text-orange-600 uppercase font-semibold">Only in CMMS</p>
          <p className="text-lg font-bold text-orange-600">{stats.cmmsOnly}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-elevated rounded-lg p-4 border border-border shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item code or description..."
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex bg-surface border border-border rounded-lg p-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filterMode === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMode('diff')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filterMode === 'diff' ? 'bg-red-600 text-white' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            Mismatch
          </button>
          <button
            onClick={() => setFilterMode('bc-only')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filterMode === 'bc-only' ? 'bg-blue-600/20 text-blue-600' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            BC Only
          </button>
          <button
            onClick={() => setFilterMode('cmms-only')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filterMode === 'cmms-only' ? 'bg-orange-600/20 text-orange-600' : 'hover:bg-surface-hover text-text-secondary'}`}
          >
            CMMS Only
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <AGGridWrapper<SparepartComparison>
          rowData={filteredData}
          columnDefs={columnDefs}
          loading={isLoading && data.length === 0}
          height={600}
          emptyMessage="No sparepart comparison data found"
        />
      </div>
    </div>
  );
}
