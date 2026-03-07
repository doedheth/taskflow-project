import { useEffect, useRef, useState } from 'react';
import { Factory, Plus, Search, X } from 'lucide-react';
import { usePlantSearch } from '@/hooks/useInspection';
import PlantModal from './PlantModal';

interface Plant { id: number; name: string; code: string }

interface PlantPickerProps {
  selectedPlant?: Plant | null;
  onChange: (plant: Plant | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PlantPicker({ selectedPlant, onChange, placeholder='Cari pabrik...', disabled=false, className='' }: PlantPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState('');
  const [isModal, setIsModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);
  const { data: plants, isLoading } = usePlantSearch(q);

  useEffect(()=>{
    function onDoc(e: MouseEvent){ if(ddRef.current && !ddRef.current.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) setIsOpen(false); }
    document.addEventListener('mousedown', onDoc); return ()=>document.removeEventListener('mousedown', onDoc);
  },[]);

  const choose = (p: Plant) => { onChange(p); setQ(''); setIsOpen(false); };
  const clear = () => { onChange(null); setQ(''); inputRef.current?.focus(); };

  return (
    <div className={`relative ${className}`}>
      {selectedPlant ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-surface min-h-[42px]">
          <Factory className="w-4 h-4 text-text-secondary"/>
          <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{selectedPlant.name}</div></div>
          {!disabled && <button type="button" onClick={clear} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="w-4 h-4 text-text-secondary"/></button>}
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"/>
            <input ref={inputRef} value={q} onChange={e=>{setQ(e.target.value); setIsOpen(true);}} onFocus={()=>setIsOpen(true)} placeholder={placeholder} disabled={disabled} className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"/>
          </div>
          <button type="button" onClick={()=>setIsModal(true)} disabled={disabled} className="flex items-center justify-center px-3 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors disabled:opacity-50" title="Tambah Pabrik"><Plus className="w-5 h-5"/></button>
        </div>
      )}

      {isOpen && !selectedPlant && (
        <div ref={ddRef} className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm italic text-text-secondary flex items-center gap-2"><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"/>Mencari...</div>
          ) : !plants || plants.length===0 ? (
            <div className="px-4 py-3 text-sm text-text-secondary">{q.length<2 ? 'Ketik minimal 2 karakter...' : (
              <div className="flex flex-col gap-2"><p>Tidak ada pabrik ditemukan</p><button type="button" onClick={()=>setIsModal(true)} className="flex items-center gap-2 text-primary hover:underline text-xs font-medium"><Plus className="w-3 h-3"/>Tambah "{q}" sebagai pabrik baru</button></div>
            )}</div>
          ) : (
            <ul className="py-1">
              {plants.map((p: any)=>(
                <li key={p.id}><button type="button" onClick={()=>choose(p)} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"><div className="flex items-center gap-3"><Factory className="w-4 h-4 text-text-secondary"/><div className="min-w-0 flex-1"><div className="font-medium text-sm">{p.name}</div></div></div></button></li>
              ))}
              <li className="border-t border-border mt-1"><button type="button" onClick={()=>setIsModal(true)} className="w-full px-4 py-2.5 text-left text-primary hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 font-medium text-xs"><Plus className="w-3.5 h-3.5"/>Tambah Pabrik Baru</button></li>
            </ul>
          )}
        </div>
      )}

      <PlantModal isOpen={isModal} onClose={()=>setIsModal(false)} onSuccess={(plant)=>{onChange(plant); setIsModal(false); setQ(''); setIsOpen(false);}} initialName={q}/>
    </div>
  );
}
