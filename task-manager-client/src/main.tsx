import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AIFeatureProvider } from '@/context/AIFeatureContext';
import App from '@/App';
import '@/index.css';

// AG Grid Module Registration
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

// Toast component that's theme-aware
const ThemedToaster = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
        },
      }}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AIFeatureProvider>
              <App />
              <ThemedToaster />
            </AIFeatureProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryProvider>
  </React.StrictMode>
);
