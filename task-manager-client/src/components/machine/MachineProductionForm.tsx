
import React, { useState, useEffect, useRef } from 'react';
import { api, inspectionsAPI, productionAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import logoHeader from '../../images/lgo-header.png';

interface Props {
  parameterSetId: number;
  assetName?: string;
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
}

const MaterialSearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}> = ({ value, onChange, placeholder, readOnly }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    if (readOnly) return;
    onChange(query);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await inspectionsAPI.searchMaterials(query);
      setSuggestions(res.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className="w-full bg-transparent outline-none border-b border-transparent focus:border-blue-500 transition-colors"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => !readOnly && value.length >= 2 && setShowSuggestions(true)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {showSuggestions && suggestions.length > 0 && !readOnly && (
        <ul className="absolute z-50 w-full min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-48 overflow-y-auto rounded mt-1 left-0">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex flex-col"
              onClick={() => {
                onChange(s.name);
                setShowSuggestions(false);
              }}
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-gray-500">{s.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const MachineProductionForm: React.FC<Props> = ({ parameterSetId, assetName, onClose, onSuccess, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [material, setMaterial] = useState([
    { name: '', percentage: '', qty: '' },
    { name: '', percentage: '', qty: '' },
    { name: '', percentage: '', qty: '' }
  ]);

  const [auxiliary, setAuxiliary] = useState([
    { name: '', unit: 'kg', qty: '' },
    { name: '', unit: 'pcs', qty: '' },
    { name: '', unit: 'pcs', qty: '' },
    { name: '', unit: 'kg', qty: '' }
  ]);

  const [waste, setWaste] = useState([
    { name: 'Waste Produk', unit: 'kg', qty: '' },
    { name: 'Gumpalan', unit: 'kg', qty: '' },
    { name: 'Cap', unit: 'kg', qty: '' },
    { name: 'Total', unit: 'kg', qty: '' }
  ]);

  const [downtime, setDowntime] = useState('');
  
  // Downtime logs from database (auto-fetched by shift)
  const [downtimeLogs, setDowntimeLogs] = useState<any[]>([]);
  const [downtimeLoading, setDowntimeLoading] = useState(false);
  const [downtimeShiftInfo, setDowntimeShiftInfo] = useState<{ name: string; start_time: string; end_time: string } | null>(null);
  
  const [production, setProduction] = useState([
    { name: 'Inner 1', pcs: '', kg: '' },
    { name: 'Inner 2', pcs: '', kg: '' }
  ]);

  const [notes, setNotes] = useState('');

  const [parameterLog, setParameterLog] = useState<any>(null);

  useEffect(() => {
    fetchReport();
    fetchParameterLog();
  }, [parameterSetId]);

  // When parameterLog is loaded, auto-fetch downtime by shift
  useEffect(() => {
    if (parameterLog?.asset_id && parameterLog?.production_date && parameterLog?.shift) {
      fetchDowntimeByShift(parameterLog.asset_id, parameterLog.production_date, parameterLog.shift);
    }
  }, [parameterLog?.asset_id, parameterLog?.production_date, parameterLog?.shift]);

  const fetchDowntimeByShift = async (assetId: number, date: string, shift: string) => {
    try {
      setDowntimeLoading(true);
      const res = await productionAPI.getDowntimeByShift({
        asset_id: assetId,
        date: date,
        shift: shift
      });
      const data = res.data;
      setDowntimeLogs(data.data || []);
      setDowntimeShiftInfo(data.shift || null);
      // Auto-set total downtime minutes
      const totalMin = data.total_minutes || 0;
      setDowntime(totalMin.toString());
    } catch (error) {
      console.error('Error fetching downtime by shift:', error);
    } finally {
      setDowntimeLoading(false);
    }
  };

  const fetchParameterLog = async () => {
    try {
      const res = await api.get(`/v2/production/logs/detail/${parameterSetId}`);
      const logData = res.data.data;
      setParameterLog(logData);
      
      // If there's an existing production report in the log detail, populate fields
      if (logData.production_report) {
        const reportData = logData.production_report;
        if (reportData.material_usage?.length) setMaterial(reportData.material_usage);
        if (reportData.material_aux_usage?.length) setAuxiliary(reportData.material_aux_usage);
        if (reportData.waste_data?.length) setWaste(reportData.waste_data);
        if (reportData.downtime_data) {
          if (reportData.downtime_data.minutes) setDowntime(reportData.downtime_data.minutes);
          if (reportData.downtime_data.logs) setDowntimeLogs(reportData.downtime_data.logs);
          if (reportData.downtime_data.shift_info) setDowntimeShiftInfo(reportData.downtime_data.shift_info);
        }
        if (reportData.production_result?.length) setProduction(reportData.production_result);
        if (reportData.notes) setNotes(reportData.notes);
      }
    } catch (error) {
      console.error('Error fetching parameter log:', error);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/v2/production/reports/${parameterSetId}`);
      const data = res.data;
      if (data) {
        if (data.material_usage?.length) setMaterial(data.material_usage);
        if (data.material_aux_usage?.length) setAuxiliary(data.material_aux_usage);
        if (data.waste_data?.length) setWaste(data.waste_data);
        if (data.downtime_data) {
          if (data.downtime_data.minutes) setDowntime(data.downtime_data.minutes);
          if (data.downtime_data.logs) setDowntimeLogs(data.downtime_data.logs);
          if (data.downtime_data.shift_info) setDowntimeShiftInfo(data.downtime_data.shift_info);
        }
        if (data.production_result?.length) setProduction(data.production_result);
        if (data.notes) setNotes(data.notes);
      }
    } catch (error) {
      // Ignore 404 (not found is expected for new report)
      console.log('No existing report found, starting fresh');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        parameter_set_id: parameterSetId,
        material_usage: material,
        material_aux_usage: auxiliary,
        waste_data: waste,
        downtime_data: { 
          minutes: downtime,
          logs: downtimeLogs.map(log => ({
            id: log.id,
            start_time: log.start_time,
            end_time: log.end_time,
            classification_name: log.classification_name,
            reason: log.reason,
            duration_minutes: log.duration_minutes
          })),
          shift_info: downtimeShiftInfo
        },
        production_result: production,
        notes
      };

      await api.post('/v2/production/reports', payload);
      toast.success('Laporan Produksi berhasil disimpan');
      onSuccess();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Gagal menyimpan laporan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Official Paper-Style Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 md:p-6 shrink-0">
          <div className="flex flex-col md:flex-row border-2 border-black bg-white dark:bg-gray-800 text-black dark:text-white">
            {/* Column 1: Logo Section */}
            <div className="md:w-1/4 p-4 border-b md:border-b-0 md:border-r-2 border-black flex flex-col items-center justify-center text-center">
              <img src={logoHeader} alt="Logo" className="h-10 mb-1" />
              <span className="text-[7px] font-black uppercase leading-tight">PT. SURYASUKSES ABADI PRIMA</span>
            </div>

            {/* Column 2: Title Section */}
            <div className="flex-1 p-4 border-b md:border-b-0 md:border-r-2 border-black flex flex-col items-center justify-center text-center font-black text-xs md:text-sm uppercase leading-tight">
              <span>LAPORAN PRODUKSI</span>
              <span>{assetName || 'MESIN PRODUKSI'}</span>
            </div>

            {/* Column 3: Doc Info Section */}
            <div className="md:w-1/3 text-[9px] font-bold">
              <div className="grid grid-cols-[80px_1fr] border-b-2 border-black">
                <div className="p-1 px-2">No. Dok</div>
                <div className="p-1 px-2 border-l-2 border-black font-mono">FRM.PRD.01.04</div>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">
          
          {/* PARAMETER DETAILS - Always show as reference */}
          {parameterLog && (
            <div className="space-y-6">
              <div className="border-2 border-black text-[11px] text-black dark:text-white">
                <div className="grid grid-cols-[140px_1fr_140px_1fr] border-b border-black font-bold bg-gray-50 dark:bg-gray-800/50">
                  <div className="px-2 py-1 border-r border-black">Tanggal</div>
                  <div className="px-2 py-1 border-r border-black font-mono">
                    {parameterLog.production_date ? format(new Date(parameterLog.production_date), 'dd/MM/yyyy') : '-'}
                  </div>
                  <div className="px-2 py-1 border-r border-black">Shift</div>
                  <div className="px-2 py-1">{parameterLog.shift}</div>
                </div>
                <div className="grid grid-cols-[140px_1fr_50px_60px] border-b border-black font-bold bg-gray-50 dark:bg-gray-800/50">
                  <div className="px-2 py-1 border-r border-black">Produk / Berat</div>
                  <div className="px-2 py-1 border-r border-black uppercase">{parameterLog.product_name}</div>
                  <div className="px-2 py-1 border-r border-black text-center">/</div>
                  <div className="px-2 py-1 text-center">gr</div>
                </div>
                <div className="grid grid-cols-[140px_1fr] border-b border-black font-bold bg-gray-50 dark:bg-gray-800/50">
                  <div className="px-2 py-1 border-r border-black">Operator</div>
                  <div className="px-2 py-1">{parameterLog.operator_name}</div>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-gray-100 dark:bg-gray-700">
                      <th className="border-r border-black px-2 py-1 w-10" rowSpan={2}>No</th>
                      <th className="border-r border-black px-2 py-1 text-left" rowSpan={2}>Parameter Check</th>
                      <th className="border-r border-black px-2 py-1 w-16" rowSpan={2}>Satuan</th>
                      <th className="border-r border-black px-2 py-1 text-center" colSpan={3}>Setting</th>
                      <th className="px-2 py-1 w-24 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" rowSpan={2}>Aktual</th>
                    </tr>
                    <tr className="border-b border-black bg-gray-100 dark:bg-gray-700">
                      <th className="border-r border-black px-2 py-1 w-20 text-center">A</th>
                      <th className="border-r border-black px-2 py-1 w-20 text-center">B</th>
                      <th className="border-r border-black px-2 py-1 w-28 text-center">C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const grouped: Record<string, any[]> = {};
                      const sectionsList: string[] = [];
                      
                      parameterLog.values?.forEach((val: any) => {
                        const section = val.section || 'General';
                        if (!grouped[section]) {
                          grouped[section] = [];
                          sectionsList.push(section);
                        }
                        grouped[section].push(val);
                      });
                      
                      return sectionsList.map((section, sectionIndex) => (
                        <React.Fragment key={section}>
                          <tr className="border-b border-black bg-gray-50 dark:bg-gray-800 font-bold">
                            <td className="border-r border-black px-2 py-1 text-center">{sectionIndex + 1}</td>
                            <td className="border-r border-black px-2 py-1 uppercase" colSpan={6}>{section}</td>
                          </tr>
                          {grouped[section].map((val: any, idx: number) => {
                            const rangeA = val.setting_a_min !== null || val.setting_a_max !== null 
                              ? `${val.setting_a_min ?? ''}-${val.setting_a_max ?? ''}` 
                              : '-';
                            const rangeB = val.setting_b_min !== null || val.setting_b_max !== null 
                              ? `${val.setting_b_min ?? ''}-${val.setting_b_max ?? ''}` 
                              : '-';
                            
                            let rangeC = '-';
                            const cValues = [
                              val.setting_a_min, val.setting_a_max,
                              val.setting_b_min, val.setting_b_max
                            ].filter((v): v is number => v !== null && v !== undefined);

                            if (cValues.length > 0) {
                              const min = Math.min(...cValues);
                              const max = Math.max(...cValues);
                              rangeC = `< ${min} / > ${max}`;
                            } else if (val.setting_c_min !== null || val.setting_c_max !== null) {
                              rangeC = `${val.setting_c_min ?? ''}-${val.setting_c_max ?? ''}`;
                            }

                            return (
                              <tr key={val.id} className="border-b border-black last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="border-r border-black px-2 py-1 text-center text-gray-400 font-mono text-[9px]">{sectionIndex + 1}.{idx + 1}</td>
                                <td className="border-r border-black px-2 py-1">
                                  {val.parameter_name}
                                </td>
                                <td className="border-r border-black px-2 py-1 text-center font-mono text-gray-500 uppercase">{val.unit || '-'}</td>
                                <td className="border-r border-black px-2 py-1 text-center text-gray-500">{rangeA}</td>
                                <td className="border-r border-black px-2 py-1 text-center text-gray-500">{rangeB}</td>
                                <td className="border-r border-black px-2 py-1 text-center text-gray-500">{rangeC}</td>
                                <td className="px-2 py-1 text-center font-mono font-bold bg-blue-50/30 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400">
                                  {val.value}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="border-b-2 border-dashed border-gray-300 dark:border-gray-700 my-8 flex items-center justify-center">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Laporan Produksi di bawah ini</span>
              </div>
            </div>
          )}

          {/* MATERIAL */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">13. Material</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">Item</th>
                  <th className="border border-gray-300 p-2 w-24 text-center">%</th>
                  <th className="border border-gray-300 p-2 w-32 text-center">Qty (kg)</th>
                </tr>
              </thead>
              <tbody>
                {material.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2 font-medium">
                      <div className="flex items-center">
                        <span className="mr-2 w-4">{String.fromCharCode(65 + idx)}.</span>
                        <MaterialSearchInput 
                          value={item.name}
                          onChange={(val) => {
                            if (readOnly) return;
                            const newMaterial = [...material];
                            newMaterial[idx].name = val;
                            setMaterial(newMaterial);
                          }}
                          placeholder="Cari Material..."
                          readOnly={readOnly}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number" 
                        step="any"
                        className="w-full text-center bg-transparent outline-none"
                        value={item.percentage}
                        onChange={e => {
                          if (readOnly) return;
                          const newMaterial = [...material];
                          newMaterial[idx].percentage = e.target.value;
                          setMaterial(newMaterial);
                        }}
                        readOnly={readOnly}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number" 
                        step="any"
                        className="w-full text-center bg-transparent outline-none"
                        value={item.qty}
                        onChange={e => {
                          if (readOnly) return;
                          const newMaterial = [...material];
                          newMaterial[idx].qty = e.target.value;
                          setMaterial(newMaterial);
                        }}
                        readOnly={readOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BAHAN PEMBANTU */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">14. Bahan Pembantu</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">Item</th>
                  <th className="border border-gray-300 p-2 w-24 text-center">Unit</th>
                  <th className="border border-gray-300 p-2 w-32 text-center">Qty</th>
                </tr>
              </thead>
              <tbody>
                {auxiliary.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2 font-medium">
                      <div className="flex items-center">
                        <span className="mr-2 w-4">{String.fromCharCode(65 + idx)}.</span>
                        <MaterialSearchInput 
                          value={item.name}
                          onChange={(val) => {
                            if (readOnly) return;
                            const newAux = [...auxiliary];
                            newAux[idx].name = val;
                            setAuxiliary(newAux);
                          }}
                          placeholder="Cari Bahan Pembantu..."
                          readOnly={readOnly}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="text" 
                        className="w-full text-center bg-transparent outline-none"
                        value={item.unit}
                        onChange={e => {
                          if (readOnly) return;
                          const newAux = [...auxiliary];
                          newAux[idx].unit = e.target.value;
                          setAuxiliary(newAux);
                        }}
                        readOnly={readOnly}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number" 
                        step="any"
                        className="w-full text-center bg-transparent outline-none"
                        value={item.qty}
                        onChange={e => {
                          if (readOnly) return;
                          const newAux = [...auxiliary];
                          newAux[idx].qty = e.target.value;
                          setAuxiliary(newAux);
                        }}
                        readOnly={readOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* WASTE */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">15. Waste</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">Item</th>
                  <th className="border border-gray-300 p-2 w-24 text-center">Unit</th>
                  <th className="border border-gray-300 p-2 w-32 text-center">Qty</th>
                </tr>
              </thead>
              <tbody>
                {waste.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {item.name === 'Total' ? '' : String.fromCharCode(65 + idx) + '. '}
                      {item.name}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-gray-500">{item.unit}</td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number" 
                        step="any"
                        className="w-full text-center bg-transparent outline-none"
                        value={item.qty}
                        onChange={e => {
                          const newWaste = [...waste];
                          newWaste[idx].qty = e.target.value;
                          setWaste(newWaste);
                        }}
                        readOnly={readOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DOWNTIME */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">16. Downtime</h3>
            
            {/* Shift info badge */}
            {downtimeShiftInfo && (
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  Data downtime dari <strong>{downtimeShiftInfo.name}</strong> ({downtimeShiftInfo.start_time} - {downtimeShiftInfo.end_time})
                  {parameterLog?.production_date && ` tanggal ${format(new Date(parameterLog.production_date), 'dd/MM/yyyy')}`}
                </span>
              </div>
            )}

            {/* Downtime logs table */}
            {downtimeLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 border border-gray-300 rounded bg-gray-50 dark:bg-gray-800">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Memuat data downtime...</span>
              </div>
            ) : downtimeLogs.length > 0 ? (
              <div className="space-y-3">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="border border-gray-300 p-2 text-left w-10 text-center">No</th>
                      <th className="border border-gray-300 p-2 text-left">Waktu</th>
                      <th className="border border-gray-300 p-2 text-left">Klasifikasi</th>
                      <th className="border border-gray-300 p-2 text-left">Alasan</th>
                      <th className="border border-gray-300 p-2 w-24 text-center">Durasi (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downtimeLogs.map((log: any, idx: number) => (
                      <tr key={log.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-850'}>
                        <td className="border border-gray-300 p-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-300 p-2 text-xs font-mono">
                          {log.start_time ? format(new Date(log.start_time), 'HH:mm') : '-'}
                          {' - '}
                          {log.end_time ? format(new Date(log.end_time), 'HH:mm') : 'Aktif'}
                        </td>
                        <td className="border border-gray-300 p-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.classification_category === 'breakdown' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            log.classification_category === 'planned_maintenance' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            log.classification_category === 'changeover' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {log.classification_name || log.downtime_type || '-'}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-2 text-gray-600 dark:text-gray-400">{log.reason || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center font-bold">{log.duration_minutes || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                      <td className="border border-gray-300 p-2" colSpan={4}>Total Downtime</td>
                      <td className="border border-gray-300 p-2 text-center text-lg">{downtime || 0} min</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 border border-gray-300 rounded bg-green-50 dark:bg-green-900/10">
                <AlertCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">Tidak ada downtime tercatat pada shift ini.</span>
                <span className="ml-auto font-bold text-green-700 dark:text-green-400">0 min</span>
              </div>
            )}
            
            {/* Input manual fallback (invisible when auto-fetch works) */}
            <input type="hidden" value={downtime} />
          </div>

          {/* HASIL PRODUKSI */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">17. Hasil Produksi</h3>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">Item</th>
                  <th className="border border-gray-300 p-2 w-32 text-center">Pcs</th>
                  <th className="border border-gray-300 p-2 w-32 text-center">Kg</th>
                </tr>
              </thead>
              <tbody>
                {production.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2 font-medium">Jumlah Cap per {item.name}</td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number" 
                        className="w-full text-center bg-transparent outline-none"
                        value={item.pcs}
                        onChange={e => {
                          if (readOnly) return;
                          const newProd = [...production];
                          newProd[idx].pcs = e.target.value;
                          setProduction(newProd);
                        }}
                        placeholder="pcs"
                        readOnly={readOnly}
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number" 
                        step="any"
                        className="w-full text-center bg-transparent outline-none"
                        value={item.kg}
                        onChange={e => {
                          if (readOnly) return;
                          const newProd = [...production];
                          newProd[idx].kg = e.target.value;
                          setProduction(newProd);
                        }}
                        placeholder="kg"
                        readOnly={readOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* NOTES */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1">Keterangan</h3>
            <textarea
              className="w-full border border-gray-300 rounded p-2 h-24 dark:bg-gray-800 dark:text-white"
              value={notes}
              onChange={e => !readOnly && setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika ada..."
              readOnly={readOnly}
            />
          </div>

        </form>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm uppercase tracking-wide"
          >
            {readOnly ? 'Tutup' : 'Batal'}
          </button>
          {!readOnly && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 disabled:opacity-50 font-black text-sm uppercase tracking-wide flex items-center gap-2"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
            </button>
          )}
        </div>
    </div>
  );
};
