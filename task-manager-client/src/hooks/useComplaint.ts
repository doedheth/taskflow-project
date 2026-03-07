import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintAPI } from '@/services/complaintApi';
import { Complaint } from '@/types/complaint';

export function useComplaintsByInspection(inspection_id: number, enabled = true) {
  return useQuery({
    queryKey: ['complaints', inspection_id],
    queryFn: async () => {
      const res = await complaintAPI.getByInspection(inspection_id);
      return res.data as Complaint[];
    },
    enabled: !!inspection_id && enabled,
  });
}

export function useComplaint(id: number, enabled = true) {
  return useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const res = await complaintAPI.getById(id);
      return res.data as Complaint;
    },
    enabled: !!id && enabled,
  });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Complaint>) => {
      const res = await complaintAPI.create(data);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      if (vars.inspection_id)
        qc.invalidateQueries({ queryKey: ['complaints', vars.inspection_id] });
    },
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Complaint> & { id: number }) => {
      const res = await complaintAPI.update(id, data);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      if (vars.inspection_id)
        qc.invalidateQueries({ queryKey: ['complaints', vars.inspection_id] });
    },
  });
}

export function useDeleteComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number; inspection_id?: number }) => {
      const res = await complaintAPI.delete(id);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      if (vars && vars.inspection_id)
        qc.invalidateQueries({ queryKey: ['complaints', vars.inspection_id] });
    },
  });
}
