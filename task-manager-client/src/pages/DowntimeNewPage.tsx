import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { assetsAPI as assetsAPILegacy, downtimeAPI as downtimeAPILegacy } from '../services/api';
import type { Asset } from '../types';
import { useNavigate } from 'react-router-dom';
import { Wrench, RefreshCw, Box, Settings } from 'lucide-react';

type DowntimeCategory = 'maintenance' | 'production' | 'changeover';

export default function DowntimeNewPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Step 1: Select Category
  const [selectedCategory, setSelectedCategory] = useState<DowntimeCategory | null>(null);
  
  // Step 2: Select Asset
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // Step 3: Additional Details (for Production) or Confirmation (for Maintenance)
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Load operational assets
        const assetsRes = await assetsAPILegacy.getAll();
        setAssets(assetsRes.data.filter((a: Asset) => a.status === 'operational'));
      } catch {
        toast.error('Gagal memuat data aset');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleStartDowntime = async () => {
    if (!selectedAsset || !selectedCategory) return;

    try {
      setLoading(true);
      
      // Determine downtime type based on category
      let downtimeType = 'unplanned';
      // let classificationCode = 'BD-PROD'; // Default

      if (selectedCategory === 'maintenance') {
        downtimeType = 'unplanned';
        // classificationCode = 'BD-PROD';
      } else if (selectedCategory === 'production') {
        downtimeType = 'unplanned';
        // classificationCode = 'IDLE-NO-ORDER'; // Default idle
      } else if (selectedCategory === 'changeover') {
        downtimeType = 'planned';
        // classificationCode = 'CO-PROD';
      }

      // Start downtime
      await downtimeAPILegacy.start({
        asset_id: selectedAsset.id,
        downtime_type: downtimeType as 'planned' | 'unplanned',
        reason: reason || `Downtime: ${selectedCategory.toUpperCase()}`,
        production_impact: selectedCategory === 'production' ? 'high' : undefined,
        // We can pass classification_id if we fetch it, but backend auto-classifies too.
        // For now, let's rely on backend or minimal input.
      });

      toast.success(`Downtime ${selectedAsset.asset_code} dimulai!`);
      navigate('/downtime-tracker');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memulai downtime');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: 'maintenance',
      title: 'Kerusakan Mesin',
      description: 'Panggil teknisi untuk perbaikan',
      icon: <Wrench className="w-8 h-8 text-red-600" />,
      color: 'bg-red-50 border-red-200 hover:border-red-500',
      textColor: 'text-red-900',
    },
    {
      id: 'production',
      title: 'Masalah Produksi',
      description: 'Tunggu bahan, operator, atau setting',
      icon: <Box className="w-8 h-8 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200 hover:border-amber-500',
      textColor: 'text-amber-900',
    },
    {
      id: 'changeover',
      title: 'Ganti Produk / Setup',
      description: 'Persiapan ganti mold atau warna',
      icon: <RefreshCw className="w-8 h-8 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200 hover:border-blue-500',
      textColor: 'text-blue-900',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mulai Downtime Baru</h1>
        <p className="text-gray-600 dark:text-gray-400">Pilih jenis masalah dan mesin yang terdampak</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
        <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
        <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id as DowntimeCategory);
                setStep(2);
              }}
              className={`p-8 rounded-2xl border-2 text-left transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-xl flex flex-col items-center text-center h-full ${cat.color}`}
            >
              <div className="mb-4 p-4 bg-white rounded-full shadow-md">
                {cat.icon}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${cat.textColor}`}>{cat.title}</h3>
              <p className="text-gray-600 text-sm">{cat.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Asset Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pilih Mesin</h2>
            <button 
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Kembali
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  setStep(3);
                }}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 hover:shadow-md transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {asset.asset_code}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${asset.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 truncate" title={asset.name}>
                  {asset.name}
                </h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && selectedAsset && selectedCategory && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className={`p-6 ${
            selectedCategory === 'maintenance' ? 'bg-red-50 dark:bg-red-900/20' : 
            selectedCategory === 'production' ? 'bg-amber-50 dark:bg-amber-900/20' : 
            'bg-blue-50 dark:bg-blue-900/20'
          }`}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Konfirmasi Downtime</h2>
            <p className="text-gray-600 dark:text-gray-300">Pastikan data di bawah ini benar sebelum memulai.</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mesin</label>
                <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  {selectedAsset.asset_code} - {selectedAsset.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Jenis Masalah</label>
                <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {selectedCategory === 'maintenance' && <Wrench className="w-5 h-5 text-red-500" />}
                  {selectedCategory === 'production' && <Box className="w-5 h-5 text-amber-500" />}
                  {selectedCategory === 'changeover' && <RefreshCw className="w-5 h-5 text-blue-500" />}
                  {categories.find(c => c.id === selectedCategory)?.title}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Keterangan Awal (Opsional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={selectedCategory === 'maintenance' ? "Contoh: Mesin bunyi kasar..." : "Contoh: Tunggu bahan baku..."}
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleStartDowntime}
                className={`flex-1 py-3 px-6 rounded-xl text-white font-bold shadow-lg transform active:scale-95 transition-all ${
                  selectedCategory === 'maintenance' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 
                  selectedCategory === 'production' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 
                  'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                Mulai Downtime 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// End of file
