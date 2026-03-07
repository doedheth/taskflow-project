/**
 * Product Picker Component
 *
 * Searchable combobox for selecting products in SPK forms
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Package } from 'lucide-react';
import { useProductSearch } from '@/hooks/useProducts';
import { Product } from '@/types';

interface ProductPickerProps {
  value?: number;
  selectedProduct?: Product | null;
  onChange: (product: Product | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ProductPicker({
  value,
  selectedProduct,
  onChange,
  placeholder = 'Cari produk...',
  disabled = false,
  className = '',
}: ProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useProductSearch(searchQuery, {
    enabled: searchQuery.length >= 1,
  });

  const products = searchResults?.data || [];

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

  const handleSelect = (product: Product) => {
    onChange(product);
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

  return (
    <div className={`relative ${className}`}>
      {/* Selected product display */}
      {selectedProduct ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-surface">
          <Package className="w-4 h-4 text-text-secondary" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{selectedProduct.code}</div>
            <div className="text-xs text-text-secondary truncate">{selectedProduct.name}</div>
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
        /* Search input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedProduct && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-text-secondary">Mencari...</div>
          ) : products.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text-secondary">
              {searchQuery.length > 0
                ? 'Tidak ada produk yang ditemukan'
                : 'Ketik untuk mencari produk'}
            </div>
          ) : (
            <ul className="py-1">
              {products.map((product: Product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{product.code}</div>
                        <div className="text-xs text-text-secondary truncate">
                          {product.name}
                        </div>
                        {product.material && (
                          <div className="text-xs text-text-secondary truncate">
                            Material: {product.material}
                          </div>
                        )}
                      </div>
                      {product.weight_gram && (
                        <div className="text-xs text-text-secondary">
                          {product.weight_gram}g
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
