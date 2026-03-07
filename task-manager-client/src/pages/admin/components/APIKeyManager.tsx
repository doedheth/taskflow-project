/**
 * API Key Manager Component
 *
 * Secure API key management with masked display and update functionality.
 * Story 7.9: Implement AI Admin Controls & Analytics - Task 8.4
 */

import React, { useState } from 'react';
import { Key, Eye, EyeOff, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '../../../services/api';

interface APIKeyStatus {
  configured: boolean;
  lastUpdated: string | null;
  maskedKey: string | null;
}

export const APIKeyManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [newApiKey, setNewApiKey] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch API key status
  const { data: keyStatus, isLoading } = useQuery<{ success: boolean; data: APIKeyStatus }>({
    queryKey: ['ai', 'api-key-status'],
    queryFn: () => aiAPI.getAPIKeyStatus(),
    staleTime: 60000,
  });

  // Update API key mutation
  const updateKeyMutation = useMutation({
    mutationFn: (apiKey: string) => aiAPI.updateAPIKey(apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'api-key-status'] });
      setNewApiKey('');
      setShowNewKey(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const handleUpdateKey = () => {
    if (newApiKey.trim() && newApiKey.startsWith('sk-')) {
      updateKeyMutation.mutate(newApiKey.trim());
    }
  };

  const status = keyStatus?.data;

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Key className="w-5 h-5 text-accent" />
        OpenAI API Key
      </h3>

      {/* Current Key Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 p-4 bg-surface-elevated rounded-lg">
          <div className={`p-2 rounded-full ${status?.configured ? 'bg-status-success/10' : 'bg-status-warning/10'}`}>
            {status?.configured ? (
              <CheckCircle className="w-5 h-5 text-status-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-status-warning" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-text-primary">
              {status?.configured ? 'API Key Configured' : 'API Key Not Configured'}
            </p>
            {status?.configured && status?.maskedKey && (
              <p className="text-sm text-text-muted font-mono mt-1">
                {status.maskedKey}
              </p>
            )}
            {status?.lastUpdated && (
              <p className="text-xs text-text-muted mt-1">
                Last updated: {new Date(status.lastUpdated).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Update Key Form */}
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            {status?.configured ? 'Update API Key' : 'Enter API Key'}
          </span>
          <p className="text-xs text-text-muted mt-1 mb-2">
            Enter your OpenAI API key (starts with sk-)
          </p>
          <div className="relative">
            <input
              type={showNewKey ? 'text' : 'password'}
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-2 pr-10 bg-surface border border-border-subtle rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowNewKey(!showNewKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </label>

        {/* Validation Message */}
        {newApiKey && !newApiKey.startsWith('sk-') && (
          <p className="text-xs text-status-error flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            API key harus dimulai dengan "sk-"
          </p>
        )}

        {/* Success Message */}
        {showSuccess && (
          <p className="text-sm text-status-success flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            API Key berhasil diupdate!
          </p>
        )}

        {/* Error Message */}
        {updateKeyMutation.isError && (
          <p className="text-sm text-status-error flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Gagal mengupdate API Key. Silakan coba lagi.
          </p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpdateKey}
          disabled={!newApiKey.trim() || !newApiKey.startsWith('sk-') || updateKeyMutation.isPending}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateKeyMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {status?.configured ? 'Update API Key' : 'Simpan API Key'}
            </>
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-status-warning/10 rounded-lg">
        <p className="text-xs text-status-warning">
          <strong>Keamanan:</strong> API key disimpan terenkripsi di database.
          Jangan pernah membagikan API key Anda kepada siapapun.
        </p>
      </div>
    </div>
  );
};

export default APIKeyManager;
