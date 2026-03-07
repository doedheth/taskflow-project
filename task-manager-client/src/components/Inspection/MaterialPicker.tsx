/**
 * Material Picker Component
 *
 * Searchable combobox for selecting materials in inspection forms
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Package, Plus } from 'lucide-react';
import { useMaterialSearch, useMaterialsList } from '@/hooks/useInspection';
import { Material } from '@/types/inspection';
import MaterialModal from './MaterialModal';

interface MaterialPickerProps {
  selectedMaterial?: Material | null;
  onChange: (material: Material | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function MaterialPicker({
  selectedMaterial,
  onChange,
  placeholder = 'Cari material...',
  disabled = false,
  className = '',
}: MaterialPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: materials, isLoading } = useMaterialSearch(searchQuery);
  const { data: initialMaterials, isLoading: isLoadingInitial } = useMaterialsList();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (material: Material) => {
    onChange(material);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleMaterialCreated = (newMaterial: Material) => {
    onChange(newMaterial);
    setIsModalOpen(false);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected material display */}
      {selectedMaterial ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-surface min-h-[42px]">
          <Package className="w-4 h-4 text-text-secondary" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{selectedMaterial.name}</div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          )}
        </div>
      ) : (
        /* Search input & Add button */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            className="flex items-center justify-center px-3 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            title="Tambah Material Baru"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedMaterial && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading || isLoadingInitial ? (
            <div className="px-4 py-3 text-sm text-text-secondary italic flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Mencari...
            </div>
          ) : !materials?.length && !initialMaterials?.length ? (
            <div className="px-4 py-3 text-sm text-text-secondary">
              {searchQuery.length < 2 ? (
                'Belum ada data material'
              ) : (
                <div className="flex flex-col gap-2">
                  <p>Tidak ada material yang ditemukan</p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 text-primary hover:underline text-xs font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah "{searchQuery}" sebagai material baru
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="py-1">
              {(searchQuery.length >= 2 ? materials : initialMaterials)?.map((material: Material) => (
                <li key={material.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(material)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-text-primary">{material.name}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              <li className="border-t border-border mt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full px-4 py-2.5 text-left text-primary hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 font-medium text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Material Baru
                </button>
              </li>
            </ul>
          )}
        </div>
      )}

      {/* Material Modal */}
      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMaterialCreated}
        initialName={searchQuery}
      />
    </div>
  );
}
