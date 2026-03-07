/**
 * Product List Page
 *
 * Master data management for Products
 */

import React, { useState, useMemo } from 'react';
import AGGridWrapper, { ColDef } from '@/components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeactivateProduct, useReactivateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useAuth } from '@/context/AuthContext';
import { Product, CreateProductDTO, UpdateProductDTO } from '@/types';
import toast from 'react-hot-toast';

export default function ProductList() {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductDTO>({
    code: '',
    name: '',
    material: '',
    weight_gram: undefined,
    default_packaging: '',
  });

  // Query
  const { data: productsData, isLoading, refetch } = useProducts({
    search: searchQuery || undefined,
    is_active: showInactive ? undefined : 1,
  });

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deactivateMutation = useDeactivateProduct();
  const reactivateMutation = useReactivateProduct();
  const deleteMutation = useDeleteProduct();

  const products: Product[] = Array.isArray(productsData?.data)
    ? productsData.data
    : productsData?.data?.data || [];

  const columnDefs = useMemo<ColDef<Product>[]>(() => {
    const cols: ColDef<Product>[] = [
      {
        headerName: 'Kode',
        field: 'code',
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams<Product>) => {
          if (!params.data) return null;
          return (
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>
              {params.data.code}
            </span>
          );
        },
      },
      {
        headerName: 'Nama Produk',
        field: 'name',
        minWidth: 250,
        cellRenderer: (params: ICellRendererParams<Product>) => {
          if (!params.data) return null;
          return (
            <span style={{ color: 'var(--color-text)' }}>
              {params.data.name}
            </span>
          );
        },
      },
      {
        headerName: 'Material',
        field: 'material',
        minWidth: 180,
        cellRenderer: (params: ICellRendererParams<Product>) => {
          if (!params.data) return null;
          return (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {params.data.material || '-'}
            </span>
          );
        },
      },
      {
        headerName: 'Berat (g)',
        field: 'weight_gram',
        minWidth: 100,
        cellRenderer: (params: ICellRendererParams<Product>) => {
          if (!params.data) return null;
          return (
            <span style={{ color: 'var(--color-text)' }}>
              {params.data.weight_gram || '-'}
            </span>
          );
        },
      },
      {
        headerName: 'Kemasan',
        field: 'default_packaging',
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<Product>) => {
          if (!params.data) return null;
          return (
            <span style={{ color: 'var(--color-text)' }}>
              {params.data.default_packaging || '-'}
            </span>
          );
        },
      },
      {
        headerName: 'Status',
        field: 'is_active',
        minWidth: 100,
        cellRenderer: (params: ICellRendererParams<Product>) => {
          if (!params.data) return null;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                params.data.is_active
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {params.data.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          );
        },
      },
    ];

    if (isManagerOrAdmin) {
      cols.push({
        headerName: 'Aksi',
        field: 'id',
        minWidth: 120,
        maxWidth: 140,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<Product>) => {
          if (!params.data) return null;
          const product = params.data;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEditForm(product)}
                className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <button
                onClick={() => handleToggleActive(product)}
                className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded"
                title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              >
                {product.is_active ? (
                  <ToggleRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {!product.is_active && (
                <button
                  onClick={() => handleDelete(product)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          );
        },
      });
    }

    return cols;
  }, [isManagerOrAdmin]);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      material: '',
      weight_gram: undefined,
      default_packaging: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      material: product.material || '',
      weight_gram: product.weight_gram || undefined,
      default_packaging: product.default_packaging || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Kode dan Nama produk harus diisi');
      return;
    }

    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          data: formData as UpdateProductDTO,
        });
        toast.success('Produk berhasil diupdate');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Produk berhasil ditambahkan');
      }
      closeForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal menyimpan produk');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      if (product.is_active) {
        await deactivateMutation.mutateAsync(product.id);
        toast.success('Produk dinonaktifkan');
      } else {
        await reactivateMutation.mutateAsync(product.id);
        toast.success('Produk diaktifkan');
      }
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal mengubah status produk');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Hapus produk "${product.code}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success('Produk berhasil dihapus');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal menghapus produk');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Master Produk</h1>
          <p className="text-text-secondary mt-1">Kelola data produk untuk SPK</p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface-elevated rounded-lg p-4 border border-border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode atau nama produk..."
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-border"
            />
            Tampilkan produk nonaktif
          </label>
        </div>
      </div>

      {/* Product Table */}
      <AGGridWrapper<Product>
        rowData={products}
        columnDefs={columnDefs}
        loading={isLoading}
        height={500}
        emptyMessage="Tidak ada produk ditemukan"
      />

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Kode Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., TUTUP-S120-BIRU"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Kemasan Default
                  </label>
                  <select
                    value={formData.default_packaging}
                    onChange={(e) => setFormData({ ...formData, default_packaging: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Pilih kemasan</option>
                    <option value="BOX">BOX</option>
                    <option value="NICTAINER">NICTAINER</option>
                    <option value="ZAK">ZAK</option>
                    <option value="KARUNG">KARUNG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., TUTUP BOTOL BIRU MUDA SOLID S.120 @5000"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="e.g., HDPE 6070 + LLDPE ASRENE UF 1810 T"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Berat (gram)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight_gram || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weight_gram: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g., 1.80"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Menyimpan...'
                    : editingProduct
                    ? 'Update'
                    : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
