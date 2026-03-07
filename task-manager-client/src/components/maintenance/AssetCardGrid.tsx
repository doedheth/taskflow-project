import { useMemo, useState } from 'react';
import type { Asset } from '../../types';

type Props = {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  recentAssetIds?: number[];
  selectedId?: number | null;
};

export default function AssetCardGrid({ assets, onSelect, recentAssetIds = [], selectedId }: Props) {
  const [query, setQuery] = useState('');
  const recentSet = useMemo(() => new Set(recentAssetIds), [recentAssetIds]);
  const sorted = useMemo(() => {
    const filtered = assets.filter(a => {
      const q = query.toLowerCase();
      return (
        a.asset_code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
      );
    });
    return filtered.sort((a, b) => {
      const aRecent = recentSet.has(a.id) ? 0 : 1;
      const bRecent = recentSet.has(b.id) ? 0 : 1;
      if (aRecent !== bRecent) return aRecent - bRecent;
      return a.asset_code.localeCompare(b.asset_code);
    });
  }, [assets, query, recentSet]);

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Cari asset..."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map(asset => (
          <button
            key={asset.id}
            onClick={() => onSelect(asset)}
            className={`text-left p-4 rounded-xl border-2 transition-all bg-white dark:bg-gray-800 relative overflow-hidden group ${
              selectedId === asset.id
                ? 'border-blue-600 ring-2 ring-blue-300 dark:ring-blue-700 shadow-md'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md focus:outline-none'
            }`}
          >
            <div className="absolute -right-12 -top-12 text-[120px] font-black text-indigo-600/5 dark:text-indigo-400/5 group-hover:text-indigo-600/10 transition-all rotate-12 group-hover:rotate-3 select-none font-mono tracking-tighter uppercase leading-none">
              {asset.asset_code}
            </div>

            <div className="flex flex-col h-full relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-extrabold text-white uppercase tracking-widest bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 px-3 py-1 rounded-lg shadow-xl border-none">
                  {asset.category_name}
                </div>
                {recentSet.has(asset.id) && (
                  <span className="text-[9px] px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold uppercase shadow-xl border-none animate-pulse">
                    Recent
                  </span>
                )}
              </div>

              <div className="flex justify-between items-end mt-auto gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {asset.name}
                  </div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5 font-bold bg-gray-100 dark:bg-gray-700/50 w-fit px-2 py-1 rounded-md shadow-inner">
                    <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {asset.location || 'No Location'}
                  </div>
                </div>

                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-purple-600 to-rose-500 tracking-tighter group-hover:scale-110 transition-all duration-300 origin-right drop-shadow-2xl font-mono leading-none select-none">
                  {asset.asset_code}
                </div>
              </div>

              {selectedId === asset.id && (
                <div className="absolute -bottom-1 -left-1 px-2 py-0.5 bg-blue-600 text-[10px] text-white font-bold rounded-tr-lg rounded-bl-lg">
                  SELECTED
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
