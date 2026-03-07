import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ComplaintForm } from '@/components/Inspection/ComplaintForm';
import { ChevronLeft, Edit, Eye, AlertCircle } from 'lucide-react';
import { useComplaint } from '@/hooks/useComplaint';
import { useInspection } from '@/hooks/useInspection';
import { toast } from 'react-hot-toast';

export const ComplaintDetailPage: React.FC = () => {
  const { inspectionId, complaintId } = useParams<{ inspectionId: string; complaintId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);

  // Parse IDs safely
  const inspectionIdNum = useMemo(() =>
    inspectionId ? parseInt(inspectionId, 10) : 0
  , [inspectionId]);

  const complaintIdNum = useMemo(() =>
    complaintId ? parseInt(complaintId, 10) : 0
  , [complaintId]);

  // Check for edit mode in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [location.search]);

  // Fetch data
  const {
    data: inspection,
    isLoading: isLoadingInspection,
    isError: isErrorInspection
  } = useInspection(inspectionIdNum, { enabled: inspectionIdNum > 0 });

  const {
    data: complaint,
    isLoading: isLoadingComplaint,
    isError: isErrorComplaint
  } = useComplaint(complaintIdNum, complaintIdNum > 0);

  const isLoading = isLoadingInspection || isLoadingComplaint;
  const isError = isErrorInspection || isErrorComplaint || !complaint;

  // Render Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-text-secondary font-medium text-sm">Memuat data komplain...</p>
      </div>
    );
  }

  // Render Error State
  if (isError) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-surface-elevated rounded-3xl border border-border shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Komplain Tidak Ditemukan</h2>
        <p className="text-text-secondary mb-8">Maaf, data komplain tidak tersedia atau Anda tidak memiliki akses.</p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary px-8"
        >
          Kembali
        </button>
      </div>
    );
  }

  const handleSuccess = () => {
    toast.success('Komplain berhasil diperbarui!');
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 pb-20">
      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/incoming-inspection/${inspectionIdNum}`)}
            className="p-2.5 hover:bg-surface rounded-xl transition-colors border border-border bg-surface-elevated shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">
              {isEditing ? 'Edit Komplain' : 'Detail Komplain'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary font-bold uppercase tracking-wider">
              <span>{inspection?.supplier_name || 'Supplier'}</span>
              <span className="opacity-30">&bull;</span>
              <span className="text-primary">{complaint.no || `ID: ${complaint.id}`}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2 px-6 h-11 rounded-xl shadow-lg shadow-primary/10`}
        >
          {isEditing ? (
            <><Eye className="w-4 h-4" /> Mode Detail</>
          ) : (
            <><Edit className="w-4 h-4" /> Edit Data</>
          )}
        </button>
      </div>

      {/* Main Form Container */}
      <div className="bg-surface-elevated p-6 md:p-10 rounded-[2.5rem] border border-border shadow-sm">
        <ComplaintForm
          inspectionId={inspectionIdNum}
          complaintId={complaintIdNum}
          onSuccess={handleSuccess}
          readOnly={!isEditing}
        />
      </div>
    </div>
  );
};
