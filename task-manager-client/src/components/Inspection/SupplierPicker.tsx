/**
 * Supplier Picker Component
 *
 * Searchable combobox for selecting suppliers in inspection forms
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Building2, Plus } from 'lucide-react';
import { useSupplierSearch, useSuppliersList } from '@/hooks/useInspection';
import { Supplier } from '@/types/inspection';
import SupplierModal from './SupplierModal';

interface SupplierPickerProps {
  selectedSupplier?: Supplier | null;
  onChange: (supplier: Supplier | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SupplierPicker({
  selectedSupplier,
  onChange,
  placeholder = 'Cari supplier...',
  disabled = false,
  className = '',
}: SupplierPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suppliers, isLoading } = useSupplierSearch(searchQuery);
  const { data: initialSuppliers, isLoading: isLoadingInitial } = useSuppliersList();

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

  const handleSelect = (supplier: Supplier) => {
    onChange(supplier);
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

  const handleSupplierCreated = (newSupplier: Supplier) => {
    onChange(newSupplier);
    setIsModalOpen(false);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected supplier display */}
      {selectedSupplier ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-surface min-h-[42px]">
          <Building2 className="w-4 h-4 text-text-secondary" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{selectedSupplier.name}</div>
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
            title="Tambah Supplier Baru"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedSupplier && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading || isLoadingInitial ? (
            <div className="px-4 py-3 text-sm text-text-secondary italic flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Mencari...
            </div>
          ) : !suppliers?.length && !initialSuppliers?.length ? (
            <div className="px-4 py-3 text-sm text-text-secondary">
              {searchQuery.length < 2 ? (
                'Belum ada data supplier'
              ) : (
                <div className="flex flex-col gap-2">
                  <p>Tidak ada supplier yang ditemukan</p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 text-primary hover:underline text-xs font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah "{searchQuery}" sebagai supplier baru
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="py-1">
              {(searchQuery.length >= 2 ? suppliers : initialSuppliers)?.map((supplier: Supplier) => (
                <li key={supplier.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(supplier)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-text-primary">{supplier.name}</div>
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
                  Tambah Supplier Baru
                </button>
              </li>
            </ul>
          )}
        </div>
      )}

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSupplierCreated}
        initialName={searchQuery}
      />
    </div>
  );
}
