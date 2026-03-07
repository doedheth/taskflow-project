import { useMemo } from 'react';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';

export interface AGGridWrapperProps<TData = unknown> extends Omit<AgGridReactProps<TData>, 'theme'> {
  height?: number | string;
  loading?: boolean;
  emptyMessage?: string;
  rowHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  onGridReady?: (params: GridReadyEvent<TData>) => void;
}

export default function AGGridWrapper<TData = unknown>({
  rowData,
  columnDefs,
  height = 500,
  loading = false,
  emptyMessage = 'Tidak ada data ditemukan',
  onGridReady,
  defaultColDef,
  ...props
}: AGGridWrapperProps<TData>) {
  const mergedDefaultColDef = useMemo<ColDef<TData>>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
    flex: 1,
    ...defaultColDef,
  }), [defaultColDef]);

  const handleGridReady = (params: GridReadyEvent<TData>) => {
    params.api.sizeColumnsToFit();
    onGridReady?.(params);
  };

  const loadingOverlayComponent = useMemo(() => {
    return () => (
      <div className="flex items-center justify-center gap-3" style={{ color: 'var(--color-text-secondary)' }}>
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Memuat data...</span>
      </div>
    );
  }, []);

  const noRowsOverlayComponent = useMemo(() => {
    return () => (
      <div className="flex flex-col items-center justify-center gap-2 py-8" style={{ color: 'var(--color-text-muted)' }}>
        <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <span>{emptyMessage}</span>
      </div>
    );
  }, [emptyMessage]);

  return (
    <div
      className={`ag-theme-custom rounded-lg overflow-hidden border border-[var(--color-border)] ${props.className || ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height, ...props.style }}
    >
      <AgGridReact<TData>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={mergedDefaultColDef}
        onGridReady={handleGridReady}
        animateRows={true}
        pagination={true}
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        loading={loading}
        loadingOverlayComponent={loadingOverlayComponent}
        noRowsOverlayComponent={noRowsOverlayComponent}
        enableCellTextSelection={true}
        suppressCellFocus={true}
        {...props}
      />
    </div>
  );
}

export type { ColDef, GridApi, GridReadyEvent };
