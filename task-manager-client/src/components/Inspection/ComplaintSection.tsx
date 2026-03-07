import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, FileText, Trash2, Edit, Eye } from 'lucide-react';
import { useComplaintsByInspection, useDeleteComplaint } from '@/hooks/useComplaint';
import { Complaint } from '@/types/complaint';
import { generateComplaintPDF } from '@/utils/complaintPdf';

interface ComplaintSectionProps {
  inspectionId: number;
}

const stripHtml = (html: string) =>
  html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() || '-';

export const ComplaintSection: React.FC<ComplaintSectionProps> = ({ inspectionId }) => {
  const { data: complaints = [], isLoading } = useComplaintsByInspection(inspectionId);
  const deleteComplaint = useDeleteComplaint();
  const navigate = useNavigate();

  const handleDelete = (c: Complaint) => {
    if (confirm(`Hapus komplain "${c.item_name || c.no || c.id}"?`)) {
      deleteComplaint.mutate({ id: c.id, inspection_id: inspectionId });
    }
  };

  return (
    <div className="bg-surface-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 dark:bg-dark-900/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-text-primary uppercase text-sm">Daftar Komplain</h3>
          {complaints.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              {complaints.length}
            </span>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold text-xs uppercase tracking-widest shadow-sm"
          onClick={() => navigate(`/incoming-inspection/${inspectionId}/complaint/new`)}
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <AlertTriangle className="w-10 h-10 opacity-10 mb-3" />
          <p className="text-sm font-medium">Belum ada komplain untuk inspeksi ini.</p>
          <p className="text-xs italic mt-1">Klik "Tambah" untuk membuat komplain baru.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-dark-900/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest w-10">No</th>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest">Nama Barang</th>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest">Batch</th>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest text-right">Qty</th>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest">Tanggal</th>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest">Keterangan</th>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest text-center">Status</th>
                <th className="px-4 py-3 font-black text-[10px] text-text-secondary uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {complaints.map((c: Complaint, idx) => (
                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-900/20 transition-colors">
                  <td className="px-4 py-3 font-bold text-text-secondary text-center">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{c.item_name || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-[11px]">{(c as any).batch_no || '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-text-primary">
                    {c.qty}{c.unit ? <span className="text-text-secondary font-normal ml-1">{c.unit}</span> : ''}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.tanggal_datang || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate" title={stripHtml(c.keterangan)}>
                    {stripHtml(c.keterangan)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'draft'
                        ? 'bg-blue-100 text-blue-700'
                        : c.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : c.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => navigate(`/incoming-inspection/${inspectionId}/complaint/${c.id}`)}
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        onClick={() => navigate(`/incoming-inspection/${inspectionId}/complaint/${c.id}?edit=true`)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-text-primary hover:bg-surface rounded-lg transition-colors"
                        onClick={() => generateComplaintPDF(c)}
                        title="Cetak PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDelete(c)}
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
