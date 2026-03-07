import { useState } from 'react';
import { Cpu, CheckCircle2, Wrench, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { MachineStatus, Machine } from '../../../hooks/useSupervisorDashboard';

interface MachineStatusWidgetProps {
  data?: MachineStatus;
  machines?: Machine[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

type StatusFilter = 'operational' | 'maintenance' | 'down' | null;

/**
 * MachineStatusWidget - Displays machine status overview for supervisor
 *
 * Features:
 * - Color-coded status indicators (green/yellow/red)
 * - Click on status to filter machine list
 * - Modal with filtered machine details
 */
export function MachineStatusWidget({
  data,
  machines = [],
  isLoading,
  isError,
  onRetry,
}: MachineStatusWidgetProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(null);
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Status Mesin"
        message="Tidak dapat memuat data status mesin"
        onRetry={onRetry}
      />
    );
  }

  if (!data) {
    return null;
  }

  const statusItems = [
    {
      key: 'operational' as const,
      label: 'Operasional',
      count: data.operational,
      icon: CheckCircle2,
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
      borderColor: 'border-status-success/30',
    },
    {
      key: 'maintenance' as const,
      label: 'Maintenance',
      count: data.maintenance,
      icon: Wrench,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
      borderColor: 'border-status-warning/30',
    },
    {
      key: 'down' as const,
      label: 'Breakdown',
      count: data.down,
      icon: AlertTriangle,
      color: 'text-status-error',
      bgColor: 'bg-status-error/10',
      borderColor: 'border-status-error/30',
    },
  ];

  const filteredMachines = selectedStatus
    ? machines.filter((m) => m.status === selectedStatus)
    : machines;

  const handleStatusClick = (status: StatusFilter) => {
    setSelectedStatus(status);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStatus(null);
  };

  return (
    <>
      <WidgetCard
        title="Status Mesin"
        subtitle={`Total: ${data.total} unit`}
        colSpan={2}
      >
        <div className="grid grid-cols-3 gap-3">
          {statusItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleStatusClick(item.key)}
              className={`
                p-4 rounded-xl border transition-all
                ${item.bgColor} ${item.borderColor}
                hover:scale-[1.02] active:scale-[0.98]
                cursor-pointer
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.count}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </WidgetCard>

      {/* Machine List Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-surface-elevated rounded-2xl border border-border w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedStatus === 'operational' && 'Mesin Operasional'}
                  {selectedStatus === 'maintenance' && 'Mesin Dalam Maintenance'}
                  {selectedStatus === 'down' && 'Mesin Breakdown'}
                </h3>
                <p className="text-sm text-text-secondary">
                  {filteredMachines.length} unit
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Machine List */}
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
              {filteredMachines.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  Tidak ada mesin dengan status ini
                </div>
              ) : (
                filteredMachines.map((machine) => (
                  <div
                    key={machine.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">
                          {machine.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {machine.asset_code}
                          {machine.location && ` • ${machine.location}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`
                          inline-block px-2 py-1 rounded-lg text-xs font-medium
                          ${machine.criticality === 'critical' && 'bg-status-error/10 text-status-error'}
                          ${machine.criticality === 'high' && 'bg-status-warning/10 text-status-warning'}
                          ${machine.criticality === 'medium' && 'bg-status-info/10 text-status-info'}
                          ${machine.criticality === 'low' && 'bg-surface text-text-muted'}
                        `}
                      >
                        {machine.criticality.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MachineStatusWidget;
