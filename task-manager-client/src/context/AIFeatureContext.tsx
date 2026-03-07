/**
 * AI Feature Context
 *
 * Provides AI feature availability checks across the application.
 * Features are controlled by admin through role-based toggles.
 *
 * Story 7.9: Implement AI Admin Controls & Analytics
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAIFeatureAvailability } from '../hooks/useAIAdmin';

interface AIFeatureContextType {
  /** Check if a specific AI feature is enabled for current user */
  isFeatureEnabled: (feature: string) => boolean;
  /** All feature availability data */
  features: Record<string, boolean>;
  /** Whether the feature availability is still loading */
  isLoading: boolean;
  /** Whether AI features are globally enabled */
  isAIEnabled: boolean;
}

const AIFeatureContext = createContext<AIFeatureContextType | undefined>(undefined);

export const AIFeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading } = useAIFeatureAvailability();

  const features = useMemo(() => {
    return data?.data || {};
  }, [data]);

  const isAIEnabled = useMemo(() => {
    // If any feature is enabled, AI is globally enabled
    return Object.values(features).some(enabled => enabled);
  }, [features]);

  const isFeatureEnabled = (feature: string): boolean => {
    // Default to true if data hasn't loaded yet (optimistic)
    if (isLoading) return true;
    // Return the specific feature status, default to false if not found
    return features[feature] ?? false;
  };

  const value = useMemo(() => ({
    isFeatureEnabled,
    features,
    isLoading,
    isAIEnabled,
  }), [features, isLoading, isAIEnabled]);

  return (
    <AIFeatureContext.Provider value={value}>
      {children}
    </AIFeatureContext.Provider>
  );
};

export const useAIFeature = () => {
  const context = useContext(AIFeatureContext);
  if (context === undefined) {
    throw new Error('useAIFeature must be used within an AIFeatureProvider');
  }
  return context;
};

/**
 * Feature names mapping for reference:
 * - chatbot: AI Chatbot
 * - smart_wo: Smart Work Order generation
 * - duplicate_detection: Duplicate ticket detection
 * - task_prioritization: AI task prioritization
 * - predictive_maintenance: Predictive maintenance
 * - report_generation: AI report generation
 * - root_cause_analysis: Root cause analysis
 * - writing_assistant: AI writing assistant
 * - pm_suggestion: PM suggestion
 */
export const AI_FEATURES = {
  CHATBOT: 'chatbot',
  SMART_WO: 'smart_wo',
  DUPLICATE_DETECTION: 'duplicate_detection',
  TASK_PRIORITIZATION: 'task_prioritization',
  PREDICTIVE_MAINTENANCE: 'predictive_maintenance',
  REPORT_GENERATION: 'report_generation',
  ROOT_CAUSE_ANALYSIS: 'root_cause_analysis',
  WRITING_ASSISTANT: 'writing_assistant',
  PM_SUGGESTION: 'pm_suggestion',
} as const;

export default AIFeatureContext;
