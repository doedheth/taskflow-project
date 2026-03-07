import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { assetsAPI as assetsAPIv2 } from '../services/api-v2';
import { downtimeAPI, assetsAPI as assetsAPILegacy } from '../services/api';
import type { Asset, DowntimeLog, FailureCode } from '../types';
import AIWritingAssistant from '../components/AIWritingAssistant';
import FailureCodePicker from '../components/maintenance/FailureCodePicker';

export default function DowntimeEnd() {
  const { id } = useParams();
  const downtimeId = id ? parseInt(id, 10) : NaN;
  const navigate = useNavigate();

  const [downtime, setDowntime] = useState<DowntimeLog | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [failureCodes, setFailureCodes] = useState<FailureCode[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const [newSegment, setNewSegment] = useState('');
  const [selectedFailureCodeId, setSelectedFailureCodeId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [reason, setReason] = useState('');
  const [unitsLost, setUnitsLost] = useState('');
  const [batchAffected, setBatchAffected] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const dtRes = await downtimeAPI.getById(downtimeId);
        const dt: DowntimeLog = dtRes.data;
        setDowntime(dt);
        // Load asset
        const assetRes = await assetsAPILegacy.getById(dt.asset_id);
        setAsset(assetRes.data);
        // Load failure codes by asset
        const fcRes = await assetsAPIv2.getFailureCodesByAsset(dt.asset_id);
        setFailureCodes(fcRes.data);
        // Prefill reason
        setReason(dt.reason || '');
      } catch (e) {
        toast.error('Gagal memuat data downtime');
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isNaN(downtimeId)) init();
  }, [downtimeId]);

  const getLevelOptions = (level: number) => {
    const opts = new Set<string>();
    failureCodes.forEach(fc => {
      const parts = (fc.category || '').split('>').map(s => s.trim()).filter(Boolean);
      if (parts.length > level) {
        const prefixOk = segments.every((seg, idx) => parts[idx] === seg);
        if (prefixOk) opts.add(parts[level]);
      }
    });
    if (opts.size === 0 && level === 0) {
      const base = new Set<string>();
      failureCodes.forEach(fc => {
        const parts = (fc.category || '').split('>').map(s => s.trim()).filter(Boolean);
        if (parts[0]) base.add(parts[0]);
      });
      return Array.from(base);
    }
    return Array.from(opts);
  };

  const addSegment = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setSegments(prev => [...prev, clean]);
    setNewSegment('');
  };
  const removeLastSegment = () => setSegments(prev => prev.slice(0, -1));

  const addNewFailureCode = async (category: string, description: string) => {
    setAdding(true);
    try {
      // Generate code and create via v2 assets API
      const gen = await assetsAPIv2.generateFailureCode(category);
      const code = gen.data.code || gen.data || '';
      const created = await assetsAPIv2.createFailureCode({ code, category, description });
      const fc: FailureCode = created.data;
      setFailureCodes(prev => [fc, ...prev]);
      setSelectedFailureCodeId(fc.id);
      toast.success(`Kode ${fc.code} dibuat`);
    } catch {
      toast.error('Gagal membuat kode');
    } finally {
      setAdding(false);
    }
  };

  const endDowntime = async () => {
    if (!downtime) return;
    try {
      // Update failure_code_id terlebih dahulu jika dipilih
      if (selectedFailureCodeId) {
        await downtimeAPI.update(downtime.id, { failure_code_id: selectedFailureCodeId });
      }
      // Lalu end downtime dengan reason dan production_impact
      const production_impact =
        unitsLost || batchAffected
          ? {
              units_lost: unitsLost ? parseInt(unitsLost) : undefined,
              batch_affected: batchAffected || undefined,
            }
          : undefined;
      await downtimeAPI.end(downtime.id, {
        reason: reason || undefined,
        production_impact,
      });
      toast.success('Downtime berhasil diakhiri');
      navigate('/downtime-tracker');
    } catch {
      toast.error('Gagal mengakhiri downtime');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!downtime || !asset) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-gray-600 dark:text-gray-400">Data downtime tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Akhiri Downtime</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Asset: <span className="font-medium">{asset.asset_code} — {asset.name}</span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
        >
          {/* Step 1: Komponen & Sub-komponen */}
          <div className="w-full flex-shrink-0 pr-6">
            <div className="rounded-xl border-2 border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4">
              <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">1. Komponen & Sub-komponen</h2>
              {segments.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub Asset Terpilih</div>
                    <button
                      type="button"
                      onClick={removeLastSegment}
                      className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
                    >
                      <span>🗑️</span> Hapus Terakhir
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {segments.map((seg, idx) => (
                      <div
                        key={`${seg}-${idx}`}
                        className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-4 shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-md shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-0.5">Level {idx + 1}</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white truncate" title={seg}>{seg}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                {getLevelOptions(segments.length).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => addSegment(opt)}
                    className="p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 hover:border-purple-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-left group min-h-[120px] flex flex-col justify-center"
                  >
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 mb-2">{opt}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Klik untuk pilih</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800">
                <span className="text-lg">➕</span>
                <input
                  value={newSegment}
                  onChange={e => setNewSegment(e.target.value)}
                  placeholder={segments.length === 0 ? 'Ketik nama komponen baru...' : 'Ketik nama sub-komponen baru...'}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => addSegment(newSegment)}
                  disabled={!newSegment.trim()}
                  className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all ${!newSegment.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-md'}`}
                >
                  Tambah
                </button>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={segments.length === 0}
                className={`px-4 py-2 rounded-lg text-white ${segments.length === 0 ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                Lanjut
              </button>
            </div>
          </div>

          {/* Step 2: Pilih/Tambah Failure Code */}
          <div className="w-full flex-shrink-0 pr-6">
            <div className="rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">2. Pilih / Tambah Failure Code</h2>
              {/* Show selected sub-component */}
              {segments.length > 0 && (
                <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sub Asset (Kategori):</div>
                  <div className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <span className="text-lg">🔧</span>
                    {segments.join(' > ')}
                  </div>
                </div>
              )}
              <FailureCodePicker
                failureCodes={failureCodes.filter(fc => {
                  // If segments exist, only show codes matching the exact category path
                  if (segments.length > 0) {
                    return fc.category === segments.join(' > ');
                  }
                  return true;
                })}
                category={segments.length > 0 ? segments.join(' > ') : null}
                selectedId={selectedFailureCodeId}
                onSelect={id => setSelectedFailureCodeId(id)}
                onAddNew={async (cat, desc) => {
                  // Force category to match segments if present
                  const category = segments.length > 0 ? segments.join(' > ') : cat;
                  await addNewFailureCode(category, desc);
                }}
                adding={adding}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedFailureCodeId}
                className={`px-4 py-2 rounded-lg text-white ${!selectedFailureCodeId ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                Lanjut
              </button>
            </div>
          </div>

          {/* Step 3: Ringkasan & Akhiri */}
          <div className="w-full flex-shrink-0">
            <div className="rounded-xl border-2 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">3. Ringkasan & Akhiri</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Units Lost
                  </label>
                  <input
                    type="number"
                    value={unitsLost}
                    onChange={(e) => setUnitsLost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={batchAffected}
                    onChange={(e) => setBatchAffected(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="No. Batch"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                  <span className="ml-2 text-xs text-indigo-500 font-normal">✨ AI Assisted</span>
                </label>
                <AIWritingAssistant
                  value={reason}
                  onChange={setReason}
                  context={{ type: 'downtime', asset: asset.name, category: 'maintenance' }}
                  assetId={asset.id}
                  placeholder="Jelaskan penyebab dan solusi..."
                  minHeight="100px"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Kembali
              </button>
              <button
                onClick={endDowntime}
                disabled={!selectedFailureCodeId}
                className={`px-5 py-2.5 rounded-lg text-white ${!selectedFailureCodeId ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                ✓ Akhiri Downtime
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
