import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ComplaintForm } from '@/components/Inspection/ComplaintForm';
import { ChevronLeft } from 'lucide-react';
import { useInspection } from '@/hooks/useInspection';
import { toast } from 'react-hot-toast';

export const NewComplaintPage: React.FC = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();

  const inspectionIdNum = inspectionId ? parseInt(inspectionId, 10) : undefined;

  const { data: inspection, isLoading: isLoadingInspection, isError: isErrorInspection } = useInspection(
    inspectionIdNum!,
    { enabled: !!inspectionIdNum }
  );

  if (isLoadingInspection) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isErrorInspection || !inspectionIdNum || !inspection) {
    toast.error('Data inspeksi tidak ditemukan atau terjadi kesalahan.');
    navigate(-1); // Go back to previous page
    return null;
  }

  const handleSuccess = () => {
    toast.success('Komplain berhasil ditambahkan!');
    navigate(`/incoming-inspection/${inspectionIdNum}`); // Navigate back to inspection detail
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
          <ChevronLeft className="w-5 h-5" /> Kembali
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Buat Komplain Baru</h1>
      </div>

      <div className="bg-surface-elevated p-6 rounded-widget border border-border">
        <ComplaintForm inspectionId={inspectionIdNum} onSuccess={handleSuccess} />
      </div>
    </div>
  );
};