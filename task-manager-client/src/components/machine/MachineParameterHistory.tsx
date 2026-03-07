import { useState, useEffect } from 'react';
import { productionAPI, assetsAPI, maintenanceAPI } from '../../services/api';
import { MachineParameterSet } from '../../types';
import { generateMachineParameterPDF } from './MachineParameterPDF';
import toast from 'react-hot-toast';
import { Download, Eye } from 'lucide-react';
import { MachineProductionForm } from './MachineProductionForm';
import { format } from 'date-fns';

interface Props {
  assetId: number;
  assetName?: string;
  onClose: () => void;
}

export default function MachineParameterHistory({ assetId, assetName, onClose }: Props) {
  const [logs, setLogs] = useState<MachineParameterSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [shifts, setShifts] = useState<{ id: number; name: string }[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDateFilter, setStartDateFilter] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDateFilter, setEndDateFilter] = useState(lastDayOfMonth.toISOString().split('T')[0]);
  const [shiftFilter, setShiftFilter] = useState('');
  const [productNameFilter, setProductNameFilter] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchShifts();
  }, [assetId, startDateFilter, endDateFilter, shiftFilter, productNameFilter]);

  useEffect(() => {
    setPage(1);
  }, [assetId, startDateFilter, endDateFilter, shiftFilter, productNameFilter, logs.length, pageSize]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await productionAPI.getLogs(assetId, {
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        shift: shiftFilter || undefined,
        productName: productNameFilter || undefined,
      });
      const logsData = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      setLoadingShifts(true);
      const res = await maintenanceAPI.getShifts();
      setShifts(res.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Gagal memuat daftar shift');
    } finally {
      setLoadingShifts(false);
    }
  };

  const handleDownload = async (logId: number) => {
    try {
      // Find the log from local logs to get the date
      const selectedLog = logs.find(l => l.id === logId);
      if (!selectedLog) return;

      const targetDate = selectedLog.production_date;
      
      // Fetch all logs for this date and asset
      const res = await productionAPI.getLogs(assetId, {
        startDate: targetDate,
        endDate: targetDate,
      });

      const logsOnDate = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      
      // Get details for each log to get the full values
      const fullLogs = await Promise.all(
        logsOnDate.map(async (l: MachineParameterSet) => {
          const detailRes = await productionAPI.getLogDetail(l.id);
          return detailRes.data.data;
        })
      );
      
      toast.promise(
        Promise.resolve().then(() => generateMachineParameterPDF(fullLogs)),
        {
          loading: 'Generating PDF...',
          success: 'PDF berhasil diunduh',
          error: 'Gagal generate PDF'
        }
      );
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal mengunduh PDF');
    }
  };


  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, logs.length);
  const pagedLogs = logs.slice(startIndex, endIndex);


  if (selectedLogId) {
    return (
      <MachineProductionForm
        parameterSetId={selectedLogId}
        assetName={assetName}
        onClose={() => setSelectedLogId(null)}
        onSuccess={() => {
          setSelectedLogId(null);
        }}
        readOnly={true}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full flex flex-col border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Riwayat Parameter & Produksi</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Tanggal Mulai"
          />
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Tanggal Akhir"
          />
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loadingShifts}
          >
            <option value="">Semua Shift</option>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.name}>
                {shift.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={productNameFilter}
            onChange={(e) => setProductNameFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Filter Produk"
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Tanggal</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Shift</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Produk</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Operator</th>
              <th className="p-3 font-semibold text-gray-700 dark:text-gray-200 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">Tidak ada data ditemukan</td>
              </tr>
            ) : (
              pagedLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                    {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm') : log.production_date}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full border ${
                      log.shift === 'Shift 1' ? 'bg-green-100 text-green-800 border-green-200' :
                      log.shift === 'Shift 2' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {log.shift}
                    </span>
                  </td>
                  <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">{log.product_name}</td>
                  <td className="p-3 text-sm text-gray-700 dark:text-gray-300">{log.operator_name}</td>
                  <td className="p-3 flex justify-center gap-2">
                    <button
                      onClick={() => setSelectedLogId(log.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(log.id)}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {logs.length === 0 ? 0 : startIndex + 1}-{endIndex} dari {logs.length} data
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
