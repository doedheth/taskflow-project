import { useMemo, useState } from 'react';
import type { FailureCode } from '../../types';

type Props = {
  failureCodes: FailureCode[];
  category: string | null;
  selectedId?: number | null;
  onSelect: (id: number) => void;
  onAddNew?: (category: string, description: string) => Promise<void> | void;
  adding?: boolean;
};

export default function FailureCodePicker({
  failureCodes,
  category,
  selectedId,
  onSelect,
  onAddNew,
  adding = false,
}: Props) {
  const [query, setQuery] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filtered = useMemo(() => {
    return failureCodes.filter(fc => {
      if (category && fc.category !== category) return false;
      const q = query.toLowerCase();
      return (
        fc.code.toLowerCase().includes(q) ||
        fc.description.toLowerCase().includes(q)
      );
    });
  }, [failureCodes, category, query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Cari kode atau deskripsi..."
        />
      </div>
      {onAddNew && (
        <div className="flex items-center gap-2">
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && category && newDesc.trim()) {
                Promise.resolve(onAddNew(category, newDesc)).then(() => {
                  setNewDesc('');
                });
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={category ? `Deskripsi kode baru untuk kategori ${category}` : 'Pilih kategori atau tentukan komponen terlebih dahulu'}
          />
          <button
            onClick={() => {
              if (!category || !newDesc.trim()) return;
              Promise.resolve(onAddNew(category, newDesc)).then(() => {
                setNewDesc('');
              });
            }}
            disabled={!category || !newDesc.trim() || adding}
            className={`px-3 py-2 rounded-lg text-white ${adding ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
            title={!category ? 'Kategori belum ditentukan' : undefined}
          >
            Tambah
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
        {filtered.map(fc => (
          <button
            key={fc.id}
            onClick={() => onSelect(fc.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group flex flex-col justify-between min-h-[100px] ${
              selectedId === fc.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800 hover:border-amber-500 hover:shadow-lg'
            }`}
          >
            <div>
              <div className={`font-mono font-bold text-lg mb-1 ${
                selectedId === fc.id
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-800 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-300'
              }`}>
                {fc.code}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{fc.description}</div>
            </div>
            {selectedId === fc.id && (
              <div className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>✓</span> Terpilih
              </div>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            Tidak ada kode untuk filter saat ini
          </div>
        )}
      </div>
    </div>
  );
}
