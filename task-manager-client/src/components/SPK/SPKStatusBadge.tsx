/**
 * SPK Status Badge Component
 *
 * Displays a colored badge based on SPK status
 */

import React from 'react';
import { SPKStatus } from '@/types';

interface SPKStatusBadgeProps {
  status: SPKStatus;
  className?: string;
}

const statusConfig: Record<SPKStatus, { bg: string; text: string; label: string }> = {
  draft: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'Draft',
  },
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    label: 'Menunggu Approval',
  },
  approved: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    label: 'Approved',
  },
  rejected: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    label: 'Ditolak',
  },
  cancelled: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-400 line-through',
    label: 'Dibatalkan',
  },
};

export default function SPKStatusBadge({ status, className = '' }: SPKStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
}

// Export status colors for use in other components
export const spkStatusColors = statusConfig;
