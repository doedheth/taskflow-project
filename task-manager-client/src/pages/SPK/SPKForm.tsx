/**
 * SPK Form Page
 *
 * Create and Edit SPK (Surat Perintah Kerja)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Send,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSPK, useCreateSPK, useUpdateSPK, useSubmitSPK, useDuplicateSPK } from '@/hooks/useSPK';
import { assetsAPI } from '@/services/api';
import ProductPicker from '@/components/SPK/ProductPicker';
import { Asset, Product, CreateSPKLineItemDTO } from '@/types';
import toast from 'react-hot-toast';

interface LineItemForm {
  id: string; // Temporary ID for React key
  product_id: number | null;
  product: Product | null;
  quantity: number;
  packaging_type: string;
  remarks: string;
}

export default function SPKForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const { user } = useAuth();

  const isEdit = !!id;
  const isDuplicate = !!duplicateId;

  // Form state
  const [assetId, setAssetId] = useState<string>('');
  const [productionDate, setProductionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Queries
  const { data: spkData, isLoading: isLoadingSPK } = useSPK(
    isEdit ? parseInt(id!) : isDuplicate ? parseInt(duplicateId!) : 0,
    { enabled: isEdit || isDuplicate }
  );

  // Mutations
  const createMutation = useCreateSPK();
  const updateMutation = useUpdateSPK();
  const submitMutation = useSubmitSPK();
  const duplicateMutation = useDuplicateSPK();

  const isSubmitting = createMutation.isPending || updateMutation.isPending || submitMutation.isPending;

  // Load assets
  useEffect(() => {
    assetsAPI.getAll().then((res) => {
      setAssets(res.data?.data || res.data || []);
    });
  }, []);

  // Load SPK data for edit or duplicate
  useEffect(() => {
    if (spkData?.data) {
      const spk = spkData.data;

      if (isEdit) {
        setAssetId(String(spk.asset_id));
        setProductionDate(spk.production_date);
        setNotes(spk.notes || '');
      } else if (isDuplicate) {
        // For duplicate, use same asset but new date
        setAssetId(String(spk.asset_id));
        setProductionDate(format(new Date(), 'yyyy-MM-dd'));
        setNotes(spk.notes || '');
      }

      // Load line items
      if (spk.line_items) {
        setLineItems(
          spk.line_items.map((item, index) => ({
            id: `item-${index}-${Date.now()}`,
            product_id: item.product_id,
            product: {
              id: item.product_id,
              code: item.product_code || '',
              name: item.product_name || '',
              material: item.product_material || null,
              weight_gram: item.product_weight_gram || null,
              default_packaging: item.packaging_type || null,
              is_active: 1,
              created_at: '',
              updated_at: '',
            },
            quantity: item.quantity,
            packaging_type: item.packaging_type || '',
            remarks: item.remarks || '',
          }))
        );
      }
    }
  }, [spkData, isEdit, isDuplicate]);

  // Add new line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `new-${Date.now()}`,
        product_id: null,
        product: null,
        quantity: 1000,
        packaging_type: '',
        remarks: '',
      },
    ]);
  };

  // Remove line item
  const removeLineItem = (itemId: string) => {
    setLineItems(lineItems.filter((item) => item.id !== itemId));
  };

  // Update line item
  const updateLineItem = (itemId: string, field: keyof LineItemForm, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === itemId) {
          if (field === 'product' && value) {
            // When product is selected, also set default packaging
            return {
              ...item,
              product: value,
              product_id: value.id,
              packaging_type: value.default_packaging || item.packaging_type,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!assetId) {
      toast.error('Pilih mesin terlebih dahulu');
      return false;
    }

    if (!productionDate) {
      toast.error('Tanggal produksi harus diisi');
      return false;
    }

    if (lineItems.length === 0) {
      toast.error('Tambahkan minimal satu item produk');
      return false;
    }

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.product_id) {
        toast.error(`Item ${i + 1}: Pilih produk`);
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error(`Item ${i + 1}: Quantity harus lebih dari 0`);
        return false;
      }
    }

    return true;
  };

  // Build line items DTO
  const buildLineItemsDTO = (): CreateSPKLineItemDTO[] => {
    return lineItems.map((item, index) => ({
      sequence: index + 1,
      product_id: item.product_id!,
      quantity: item.quantity,
      packaging_type: item.packaging_type || undefined,
      remarks: item.remarks || undefined,
    }));
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    try {
      const data = {
        asset_id: parseInt(assetId),
        production_date: productionDate,
        notes: notes || undefined,
        line_items: buildLineItemsDTO(),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: parseInt(id!), data });
        toast.success('SPK berhasil diupdate');
      } else {
        const result = await createMutation.mutateAsync(data);
        toast.success('SPK berhasil dibuat');
        navigate(`/spk/${result.data.id}`);
        return;
      }

      navigate('/spk');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal menyimpan SPK');
    }
  };

  // Handle save and submit
  const handleSaveAndSubmit = async () => {
    if (!validateForm()) return;

    try {
      const data = {
        asset_id: parseInt(assetId),
        production_date: productionDate,
        notes: notes || undefined,
        line_items: buildLineItemsDTO(),
      };

      let spkId: number;

      if (isEdit) {
        await updateMutation.mutateAsync({ id: parseInt(id!), data });
        spkId = parseInt(id!);
      } else {
        const result = await createMutation.mutateAsync(data);
        spkId = result.data.id;
      }

      // Submit for approval
      await submitMutation.mutateAsync(spkId);
      toast.success('SPK berhasil disubmit untuk approval');
      navigate('/spk');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal menyimpan SPK');
    }
  };

  if ((isEdit || isDuplicate) && isLoadingSPK) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/spk')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEdit ? 'Edit SPK' : isDuplicate ? 'Duplikat SPK' : 'Buat SPK Baru'}
          </h1>
          <p className="text-text-secondary mt-1">
            {isEdit
              ? 'Ubah data Surat Perintah Kerja'
              : 'Buat Surat Perintah Kerja baru'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-surface-elevated rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Asset */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Mesin <span className="text-red-500">*</span>
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Pilih Mesin</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_code} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Production Date */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tanggal Produksi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Catatan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Item Produk
            </h3>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Tambah Item
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary mb-4">Belum ada item produk</p>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Tambah Item Pertama
              </button>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-8 px-3 py-2"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      No
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Produk
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase w-32">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase w-32">
                      Kemasan
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Keterangan
                    </th>
                    <th className="w-12 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2 text-center">
                        <GripVertical className="w-4 h-4 text-text-secondary cursor-move" />
                      </td>
                      <td className="px-3 py-2 text-sm text-text-secondary">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <ProductPicker
                          selectedProduct={item.product}
                          onChange={(product) => updateLineItem(item.id, 'product', product)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)
                          }
                          min="1"
                          className="w-full px-2 py-1 border border-border rounded bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.packaging_type}
                          onChange={(e) => updateLineItem(item.id, 'packaging_type', e.target.value)}
                          className="w-full px-2 py-1 border border-border rounded bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">-</option>
                          <option value="BOX">BOX</option>
                          <option value="NICTAINER">NICTAINER</option>
                          <option value="ZAK">ZAK</option>
                          <option value="KARUNG">KARUNG</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => updateLineItem(item.id, 'remarks', e.target.value)}
                          placeholder="Keterangan..."
                          className="w-full px-2 py-1 border border-border rounded bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                          title="Hapus Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate('/spk')}
          className="px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Simpan Draft
        </button>
        <button
          type="button"
          onClick={handleSaveAndSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Memproses...' : 'Simpan & Submit'}
        </button>
      </div>
    </div>
  );
}
