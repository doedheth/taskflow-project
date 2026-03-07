import React, { useState, useEffect } from 'react';
import { productionAPI } from '../../services/api';
import { MachineParameter } from '../../types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, Settings, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  assetId: number;
  assetName: string;
  onClose: () => void;
}

interface SortableItemProps {
  id: number;
  param: MachineParameter;
  onEdit: (param: MachineParameter) => void;
  onDelete: (id: number) => void;
  getRangeText: (min?: number | null, max?: number | null) => string;
  getRangeCText: (param: MachineParameter) => string;
}

function SortableParameterItem({ id, param, onEdit, onDelete, getRangeText, getRangeCText }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{param.name}</div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {param.unit && <span className="bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-xs">{param.unit}</span>}
            <span>A: {getRangeText(param.setting_a_min, param.setting_a_max)}</span>
            <span>B: {getRangeText(param.setting_b_min, param.setting_b_max)}</span>
            <span>C: {getRangeCText(param)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(param)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(param.id)}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Hapus"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function MachineParameterConfig({ assetId, assetName, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [parameters, setParameters] = useState<Record<string, MachineParameter[]>>({});
  const [sections, setSections] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form State
  const [form, setForm] = useState({
    section: '',
    name: '',
    unit: '',
    setting_a_min: '',
    setting_a_max: '',
    setting_b_min: '',
    setting_b_max: '',
  });

  useEffect(() => {
    fetchParameters();
  }, [assetId]);

  const fetchParameters = async () => {
    try {
      setLoading(true);
      const res = await productionAPI.getParameters(assetId);
      setParameters(res.data.data);
      setSections(res.data.sections || Object.keys(res.data.data));
    } catch (error) {
      console.error('Error fetching parameters:', error);
      toast.error('Gagal memuat parameter');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, section: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parameters[section].findIndex(p => p.id === active.id);
      const newIndex = parameters[section].findIndex(p => p.id === over.id);

      const newParams = arrayMove(parameters[section], oldIndex, newIndex);
      
      // Update local state first for smooth UI
      setParameters({
        ...parameters,
        [section]: newParams
      });

      // Prepare orders for backend
      // We only update sort_order for items in this section
      // The sort_order should be globally unique or at least preserve the overall order
      // Let's just update all items in this section with new sort_orders
      try {
        const orders = newParams.map((p, idx) => ({
          id: p.id,
          sort_order: idx + 1, // This is simplified, might need better logic if sort_order is cross-section
          section: section
        }));
        
        await productionAPI.updateParametersOrder(orders);
      } catch (error) {
        console.error('Error saving order:', error);
        toast.error('Gagal menyimpan urutan');
        fetchParameters(); // Revert on error
      }
    }
  };

  const handleEdit = (param: MachineParameter) => {
    setEditingId(param.id);
    setForm({
      section: param.section,
      name: param.name,
      unit: param.unit || '',
      setting_a_min: param.setting_a_min?.toString() || '',
      setting_a_max: param.setting_a_max?.toString() || '',
      setting_b_min: param.setting_b_min?.toString() || '',
      setting_b_max: param.setting_b_max?.toString() || '',
    });
    setShowAddForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm({
      section: '',
      name: '',
      unit: '',
      setting_a_min: '',
      setting_a_max: '',
      setting_b_min: '',
      setting_b_max: '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus parameter ini?')) return;
    
    try {
      await productionAPI.deleteParameter(id);
      toast.success('Parameter berhasil dihapus');
      fetchParameters();
    } catch (error) {
      console.error('Error deleting parameter:', error);
      toast.error('Gagal menghapus parameter');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        asset_id: assetId,
        section: form.section,
        name: form.name,
        unit: form.unit || undefined,
        setting_a_min: form.setting_a_min ? parseFloat(form.setting_a_min) : undefined,
        setting_a_max: form.setting_a_max ? parseFloat(form.setting_a_max) : undefined,
        setting_b_min: form.setting_b_min ? parseFloat(form.setting_b_min) : undefined,
        setting_b_max: form.setting_b_max ? parseFloat(form.setting_b_max) : undefined,
      };

      if (editingId) {
        await productionAPI.updateParameter(editingId, payload);
        toast.success('Parameter diperbarui');
      } else {
        await productionAPI.createParameter(payload);
        toast.success('Parameter ditambahkan');
      }
      
      setShowAddForm(false);
      fetchParameters();
    } catch (error) {
      console.error('Error saving parameter:', error);
      toast.error('Gagal menyimpan parameter');
    }
  };

  const getRangeText = (minValue?: number | null, maxValue?: number | null) => {
    if (minValue !== null && minValue !== undefined && maxValue !== null && maxValue !== undefined) {
      return `${minValue}-${maxValue}`;
    }
    if (minValue !== null && minValue !== undefined) return `>${minValue}`;
    if (maxValue !== null && maxValue !== undefined) return `<${maxValue}`;
    return '-';
  };

  const getPreviewCText = () => {
    const values = [
      form.setting_a_min, form.setting_a_max,
      form.setting_b_min, form.setting_b_max
    ].map(v => v ? parseFloat(v) : null).filter((v): v is number => v !== null && !isNaN(v));

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return `< ${min} / > ${max}`;
    }
    return '-';
  };

  const getRangeCText = (param: MachineParameter) => {
    // Logic: C is < Min(A,B) or > Max(A,B)
    const values = [
      param.setting_a_min, param.setting_a_max,
      param.setting_b_min, param.setting_b_max
    ].filter((v): v is number => v !== null && v !== undefined);

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return `< ${min} / > ${max}`;
    }
    return '-';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full flex flex-col border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Konfigurasi Parameter
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mesin: {assetName}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Kembali
          </button>
          <button 
            onClick={handleAddNew}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Parameter
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
        {showAddForm && (
          <div className="mb-8 p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Edit Parameter' : 'Tambah Parameter Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Section / Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={form.section}
                    onChange={e => setForm({...form, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Contoh: Temp Cooling"
                    list="sections"
                  />
                  <datalist id="sections">
                    {Object.keys(parameters).map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Parameter (Opsional)
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Contoh: Chiller (Kosongkan jika hanya section)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Satuan (Unit)
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Contoh: °C, Bar, MM"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Setting A (Min)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.setting_a_min}
                      onChange={e => setForm({...form, setting_a_min: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 mb-1">
                      Setting A (Max)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.setting_a_max}
                      onChange={e => setForm({...form, setting_a_max: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Setting B (Min)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.setting_b_min}
                      onChange={e => setForm({...form, setting_b_min: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 mb-1">
                      Setting B (Max)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.setting_b_max}
                      onChange={e => setForm({...form, setting_b_max: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Setting C (Derived)
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      {getPreviewCText()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Otomatis dihitung dari A & B</p>
                  </div>
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Range A
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      {getRangeText(
                        form.setting_a_min ? parseFloat(form.setting_a_min) : null,
                        form.setting_a_max ? parseFloat(form.setting_a_max) : null
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Range B
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      {getRangeText(
                        form.setting_b_min ? parseFloat(form.setting_b_min) : null,
                        form.setting_b_max ? parseFloat(form.setting_b_max) : null
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Range C
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      {getPreviewCText()}
                    </div>
                  </div>
                </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Simpan
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading parameters...</div>
        ) : Object.keys(parameters).length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada parameter yang dikonfigurasi.</p>
            <button 
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Parameter Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map(section => (
              <div key={section} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white flex justify-between items-center">
                  <span>{section}</span>
                  <span className="text-xs font-normal text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                    {parameters[section]?.length || 0} items
                  </span>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, section)}
                  >
                    <SortableContext
                      items={parameters[section]?.map(p => p.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      {parameters[section]?.map(param => (
                        <SortableParameterItem
                          key={param.id}
                          id={param.id}
                          param={param}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          getRangeText={getRangeText}
                          getRangeCText={getRangeCText}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
