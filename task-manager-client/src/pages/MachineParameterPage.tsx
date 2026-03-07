import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productionAPI, assetsAPI } from '../services/api';
import { Asset } from '../types';
import toast from 'react-hot-toast';
import { History, Play, CheckCircle2, Factory, ClipboardList, Settings, X } from 'lucide-react';
import MachineParameterForm from '../components/machine/MachineParameterForm';
import { MachineProductionForm } from '../components/machine/MachineProductionForm';
import MachineParameterHistory from '../components/machine/MachineParameterHistory';
import MachineParameterConfig from '../components/machine/MachineParameterConfig';
import logoHeader from '../images/lgo-header.png';
import { format } from 'date-fns';

export default function MachineParameterPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [view, setView] = useState<'list' | 'form' | 'history' | 'config' | 'production_report'>('list');
  const [createdParameterSetId, setCreatedParameterSetId] = useState<number | null>(null);
  const [showMachineSelector, setShowMachineSelector] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await assetsAPI.getAll({ status: 'operational' });
      setAssets(res.data);

      // Auto-select if only one
      if (res.data.length === 1) {
        setSelectedAsset(res.data[0]);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Gagal memuat daftar mesin');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInput = () => {
    setShowMachineSelector(true);
  };

  const selectMachineForInput = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowMachineSelector(false);
    setView('form');
  };

  const handleConfig = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setSelectedAsset(asset);
    setView('config');
  };

  if (view === 'config' && selectedAsset) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <MachineParameterConfig
          assetId={selectedAsset.id}
          assetName={selectedAsset.name}
          onClose={() => setView('list')}
        />
      </div>
    );
  }

  if (view === 'form' && selectedAsset) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <MachineParameterForm
          assetId={selectedAsset.id}
          assetName={selectedAsset.name}
          onClose={() => setView('list')}
          onSuccess={(id) => {
            if (id) {
              setCreatedParameterSetId(id);
              setView('production_report');
            } else {
              setView('list');
            }
          }}
        />
      </div>
    );
  }

  if (view === 'production_report' && createdParameterSetId) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <MachineProductionForm
          parameterSetId={createdParameterSetId}
          assetName={selectedAsset?.name}
          onClose={() => setView('list')}
          onSuccess={() => setView('list')}
        />
      </div>
    );
  }

  // Machine Selector Modal
  if (showMachineSelector) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pilih Mesin</h3>
            <button onClick={() => setShowMachineSelector(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-4">Loading assets...</div>
              ) : assets.length > 0 ? (
                assets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => selectMachineForInput(asset)}
                    className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                  >
                    <div className="p-3 rounded-full mr-4 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Factory className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{asset.asset_code}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada mesin yang tersedia
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <img src={logoHeader} alt="Logo" className="h-10 w-auto opacity-80" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">Setting Parameter & Produksi</h1>
            <p className="text-xs text-text-secondary mt-1">Pencatatan parameter mesin dan laporan produksi harian</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Official Paper-Style Header (similar to InspectionForm) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 md:p-6">
            <div className="flex flex-col md:flex-row border-2 border-black bg-white dark:bg-gray-800 text-black dark:text-white">
              {/* Column 1: Logo Section */}
              <div className="md:w-1/4 p-4 border-b md:border-b-0 md:border-r-2 border-black flex flex-col items-center justify-center text-center">
                <img src={logoHeader} alt="Logo" className="h-10 mb-1" />
                <span className="text-[7px] font-black uppercase leading-tight">PT. SURYASUKSES ABADI PRIMA</span>
              </div>

              {/* Column 2: Title Section */}
              <div className="flex-1 p-4 border-b md:border-b-0 md:border-r-2 border-black flex flex-col items-center justify-center text-center font-black text-xs md:text-sm uppercase leading-tight">
                <span>SETTING PARAMETER</span>
                <span>DAFTAR MESIN</span>
              </div>

              {/* Column 3: Doc Info Section */}
              <div className="md:w-1/3 text-[9px] font-bold">
                <div className="grid grid-cols-[80px_1fr] border-b-2 border-black">
                  <div className="p-1 px-2">No. Dok</div>
                  <div className="p-1 px-2 border-l-2 border-black font-mono">FRM.PRD.01.03</div>
                </div>
                <div className="grid grid-cols-[80px_1fr] border-b-2 border-black">
                  <div className="p-1 px-2">No. Rev</div>
                  <div className="p-1 px-2 border-l-2 border-black font-mono">00</div>
                </div>
                <div className="grid grid-cols-[80px_1fr] border-b-2 border-black">
                  <div className="p-1 px-2">Tanggal</div>
                  <div className="p-1 px-2 border-l-2 border-black font-mono">{format(new Date(), 'dd MMM yyyy')}</div>
                </div>
                <div className="grid grid-cols-[80px_1fr]">
                  <div className="p-1 px-2">Hal</div>
                  <div className="p-1 px-2 border-l-2 border-black font-mono">1 dari 1</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 text-center py-4">Loading assets...</div>
              ) : assets.length > 0 ? (
                assets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => selectMachineForInput(asset)}
                    className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group bg-white dark:bg-gray-800 cursor-pointer"
                  >
                    <div className="p-3 rounded-full mr-4 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Factory className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{asset.asset_code}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</p>
                    </div>
                    <button
                      onClick={(e) => handleConfig(asset, e)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                      title="Konfigurasi Parameter"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  Tidak ada mesin yang tersedia
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
