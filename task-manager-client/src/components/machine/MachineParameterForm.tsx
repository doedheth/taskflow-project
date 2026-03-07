import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productionAPI, productsAPI } from '../../services/api';
import { MachineParameter, Product } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Search, Plus, Package, Loader2 } from 'lucide-react';
import logoHeader from '../../images/lgo-header.png';

interface Props {
  assetId: number;
  assetName?: string;
  onClose: () => void;
  onSuccess: (id?: number) => void;
}

interface FormState {
  production_date: string;
  shift: string;
  product_name: string;
  product_id?: number;
  product_weight: string;
  operator_name: string;
  values: Record<number, string>; // parameter_id -> value (string for input)
}

export default function MachineParameterForm({ assetId, assetName, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parameters, setParameters] = useState<Record<string, MachineParameter[]>>({});
  const [sections, setSections] = useState<string[]>([]);
  
  // Product Search State
  const [productSearch, setProductSearch] = useState('');
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>({
    production_date: format(new Date(), 'yyyy-MM-dd'),
    shift: 'Shift 1',
    product_name: '',
    product_weight: '',
    operator_name: user?.name || '',
    values: {},
  });

  useEffect(() => {
    fetchParameters();
  }, [assetId]);

  // Handle outside click for product dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (productSearch.length >= 1) {
        setIsSearchingProducts(true);
        try {
          const res = await productsAPI.search(productSearch);
          setProductResults(res.data.data || []);
          setShowProductDropdown(true);
        } catch (error) {
          console.error('Error searching products:', error);
        } finally {
          setIsSearchingProducts(false);
        }
      } else {
        setProductResults([]);
        setShowProductDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearch]);

  const handleSelectProduct = (product: Product) => {
    setForm(prev => ({
      ...prev,
      product_name: product.name,
      product_id: product.id,
      product_weight: product.weight_gram?.toString() || ''
    }));
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const handleAddNewProduct = async () => {
    if (!productSearch.trim()) return;
    
    try {
      setSubmitting(true);
      const res = await productsAPI.create({
        code: `PROD-${Date.now()}`, // Temporary code
        name: productSearch,
        weight_gram: parseFloat(form.product_weight) || 0
      });
      
      const newProduct = res.data.data;
      setForm(prev => ({
        ...prev,
        product_name: newProduct.name,
        product_id: newProduct.id
      }));
      toast.success('Produk baru ditambahkan');
      setShowProductDropdown(false);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Gagal menambahkan produk baru');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchParameters = async () => {
    try {
      setLoading(true);
      const res = await productionAPI.getParameters(assetId);
      
      // Filter out sections 13 and above
      const allData = res.data.data;
      const allSections = res.data.sections || Object.keys(allData);
      
      const filteredSections = allSections.filter(section => {
        const match = section.match(/^(\d+)\./);
        if (match) {
          const num = parseInt(match[1]);
          return num < 13;
        }
        return true;
      });

      const filteredData: Record<string, MachineParameter[]> = {};
      filteredSections.forEach(section => {
        filteredData[section] = allData[section];
      });

      setParameters(filteredData);
      setSections(filteredSections);
    } catch (error) {
      console.error('Error fetching parameters:', error);
      toast.error('Gagal memuat parameter mesin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (paramId: number, value: string) => {
    setForm(prev => ({
      ...prev,
      values: { ...prev.values, [paramId]: value }
    }));
  };

  const validateValue = (param: MachineParameter, value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Invalid number';
    const inRange = (minVal: number | null, maxVal: number | null) => {
      if (minVal === null && maxVal === null) return false;
      if (minVal !== null && num < minVal) return false;
      if (maxVal !== null && num > maxVal) return false;
      return true;
    };
    const hasAnyRange =
      param.setting_a_min !== null || param.setting_a_max !== null ||
      param.setting_b_min !== null || param.setting_b_max !== null;
      
    if (!hasAnyRange) return null;
    const matchesA = inRange(param.setting_a_min, param.setting_a_max);
    const matchesB = inRange(param.setting_b_min, param.setting_b_max);
    
    // Check Derived C ( < Min or > Max )
    let matchesC = false;
    const values = [
      param.setting_a_min, param.setting_a_max,
      param.setting_b_min, param.setting_b_max
    ].filter((v): v is number => v !== null && v !== undefined);
    
    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (num < min || num > max) matchesC = true;
    }

    if (matchesA || matchesB || matchesC) return null;
    return 'Out of range';
  };

  const getRangeText = (minValue: number | null, maxValue: number | null) => {
    if (minValue !== null && maxValue !== null) return `${minValue}-${maxValue}`;
    if (minValue !== null) return `>${minValue}`;
    if (maxValue !== null) return `<${maxValue}`;
    return '-';
  };

  const getRangeCText = (param: MachineParameter) => {
    // Logic: C is < Min(A,B) or > Max(A,B)
    const values = [
      param.setting_a_min, param.setting_a_max,
      param.setting_b_min, param.setting_b_max
    ].filter((v): v is number => v !== null && v !== undefined);

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return `< ${min} / > ${max}`;
    }
    
    return getRangeText(param.setting_c_min, param.setting_c_max);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check for existing shift on the same date
      const checkRes = await productionAPI.getLogs(assetId, { 
        date: form.production_date, 
        shift: form.shift,
        limit: 1 
      });
      
      if (checkRes.data.data.length > 0) {
        const confirmMsg = `Data untuk ${form.shift} pada tanggal ${format(new Date(form.production_date), 'dd/MM/yyyy')} sudah ada. Apakah Anda ingin tetap melanjutkan?`;
        if (!window.confirm(confirmMsg)) {
          setSubmitting(false);
          return;
        }
      }

      // Prepare payload
      const payload = {
        asset_id: assetId,
        production_date: form.production_date,
        shift: form.shift,
        product_name: form.product_name,
        operator_name: form.operator_name,
        values: Object.entries(form.values).map(([id, val]) => ({
          parameter_id: parseInt(id),
          value: parseFloat(val)
        })).filter(v => !isNaN(v.value))
      };

      const res = await productionAPI.submitLog(payload);
      toast.success('Data berhasil disimpan');
      if (onSuccess) onSuccess(res.data.id);
    } catch (error) {
      console.error('Error submitting log:', error);
      toast.error('Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading parameters...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
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
              <span>SETTING PARAMETER</span>
              <span>{assetName || 'MESIN PRODUKSI'}</span>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">
          <div className="border-2 border-black text-[11px] font-bold text-black dark:text-white">
            <div className="grid grid-cols-[140px_1fr_90px_1fr] border-b border-black">
              <div className="px-2 py-1 border-r border-black">Tanggal</div>
              <div className="px-2 py-1 border-r border-black">
                <input
                  type="date"
                  required
                  value={form.production_date}
                  onChange={e => setForm({...form, production_date: e.target.value})}
                  className="w-full bg-transparent outline-none"
                />
              </div>
              <div className="px-2 py-1 border-r border-black">Shift</div>
              <div className="px-2 py-1">
                <select
                  value={form.shift}
                  onChange={e => setForm({...form, shift: e.target.value})}
                  className="w-full bg-transparent outline-none"
                >
                  <option>Shift 1</option>
                  <option>Shift 2</option>
                  <option>Shift 3</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr_50px_60px] border-b border-black">
              <div className="px-2 py-1 border-r border-black">Produk / Berat</div>
              <div className="px-2 py-1 border-r border-black relative">
                <div className="flex items-center gap-2">
                  <Search className="w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={productSearch}
                    onChange={e => {
                      setProductSearch(e.target.value);
                      setForm(prev => ({ ...prev, product_name: e.target.value }));
                    }}
                    onFocus={() => productSearch.length >= 1 && setShowProductDropdown(true)}
                    className="w-full bg-transparent outline-none uppercase"
                    placeholder="CARI PRODUK..."
                  />
                  {isSearchingProducts && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </div>

                {/* Product Search Dropdown */}
                {showProductDropdown && (
                  <div 
                    ref={productDropdownRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border-2 border-black shadow-xl z-50 max-h-48 overflow-y-auto"
                  >
                    {productResults.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {productResults.map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col"
                          >
                            <span className="font-bold text-[10px] text-gray-900 dark:text-white uppercase">{product.name}</span>
                            <span className="text-[8px] text-gray-500 uppercase">{product.code} - {product.weight_gram}gr</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center">
                        <p className="text-[10px] text-gray-500 mb-2 uppercase">Produk tidak ditemukan</p>
                        <button
                          type="button"
                          onClick={handleAddNewProduct}
                          className="w-full py-1 bg-black text-white text-[9px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-gray-800"
                        >
                          <Plus className="w-3 h-3" /> Tambah "{productSearch}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-2 py-1 border-r border-black text-center">
                <input
                  type="number"
                  step="any"
                  value={form.product_weight}
                  onChange={e => setForm({...form, product_weight: e.target.value})}
                  className="w-full bg-transparent outline-none text-center"
                />
              </div>
              <div className="px-2 py-1 text-center">gr</div>
            </div>
            <div className="grid grid-cols-[140px_1fr]">
              <div className="px-2 py-1 border-r border-black">Operator</div>
              <div className="px-2 py-1 bg-gray-50 dark:bg-gray-800/50">
                <input
                  type="text"
                  readOnly
                  value={form.operator_name}
                  className="w-full bg-transparent outline-none uppercase font-bold text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="border-2 border-black text-[11px] text-black dark:text-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="border-r border-black px-2 py-1 w-8">No</th>
                  <th className="border-r border-black px-2 py-1 text-left w-1/3">Parameter Check</th>
                  <th className="border-r border-black px-2 py-1 w-16">Satuan</th>
                  <th className="border-r border-black px-2 py-1" colSpan={3}>Setting</th>
                  <th className="px-2 py-1 w-24">Actual</th>
                </tr>
                <tr className="border-b border-black">
                  <th className="border-r border-black px-2 py-1"></th>
                  <th className="border-r border-black px-2 py-1"></th>
                  <th className="border-r border-black px-2 py-1"></th>
                  <th className="border-r border-black px-2 py-1 w-20">A</th>
                  <th className="border-r border-black px-2 py-1 w-20">B</th>
                  <th className="border-r border-black px-2 py-1 w-28">C</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr className="border-b border-black">
                    <td className="px-2 py-3 text-center" colSpan={7}>
                      Tidak ada parameter yang dikonfigurasi untuk mesin ini.
                    </td>
                  </tr>
                ) : (
                  sections.map((section, sectionIndex) => {
                    const params = parameters[section] || [];
                    const firstParam = params[0];
                    const shouldMergeHeader = firstParam && !firstParam.name;

                    if (shouldMergeHeader) {
                      // Merged Row Logic
                      const param = firstParam;
                      const value = form.values[param.id] || '';
                      const validationMsg = validateValue(param, value);
                      const isError = validationMsg && validationMsg.startsWith('Invalid');
                      const isWarning = validationMsg && !isError;
                      const rangeA = getRangeText(param.setting_a_min, param.setting_a_max);
                      const rangeB = getRangeText(param.setting_b_min, param.setting_b_max);
                      const rangeC = getRangeCText(param);

                      return (
                        <React.Fragment key={section}>
                          <tr className="border-b border-black bg-gray-100 dark:bg-gray-800">
                            <td className="border-r border-black px-2 py-1 text-center font-bold">{sectionIndex + 1}</td>
                            <td className="border-r border-black px-2 py-1 font-bold">
                              {section}
                            </td>
                            <td className="border-r border-black px-2 py-1 text-center">{param.unit || ''}</td>
                            <td className="border-r border-black px-2 py-1 text-center">{rangeA}</td>
                            <td className="border-r border-black px-2 py-1 text-center">{rangeB}</td>
                            <td className="border-r border-black px-2 py-1 text-center">{rangeC}</td>
                            <td className="px-2 py-1 bg-blue-50/50 dark:bg-blue-900/10">
                              <input
                                type="number"
                                step="any"
                                value={value}
                                onChange={e => handleChange(param.id, e.target.value)}
                                className={`w-full bg-transparent outline-none text-center font-bold ${
                                  isError ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-700 dark:text-blue-400'
                                }`}
                                placeholder="..."
                              />
                            </td>
                          </tr>
                          {params.slice(1).map((p, idx) => renderParamRow(p, idx + 1))}
                        </React.Fragment>
                      );
                    }

                    return (
                      <React.Fragment key={section}>
                        <tr className="border-b border-black bg-gray-100 dark:bg-gray-800">
                          <td className="border-r border-black px-2 py-1 text-center font-bold">{sectionIndex + 1}</td>
                          <td className="border-r border-black px-2 py-1 font-bold" colSpan={6}>
                            {section}
                          </td>
                        </tr>
                        {params.map((param, idx) => renderParamRow(param, idx))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm uppercase tracking-wide"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 disabled:opacity-50 font-black text-sm uppercase tracking-wide flex items-center gap-2"
          >
            {submitting ? 'Menyimpan...' : 'Lanjutkan'}
          </button>
        </div>
      </div>
  );

  function renderParamRow(param: MachineParameter, idx: number) {
    const value = form.values[param.id] || '';
    const validationMsg = validateValue(param, value);
    const isError = validationMsg && validationMsg.startsWith('Invalid');
    const isWarning = validationMsg && !isError;
    const rangeA = getRangeText(param.setting_a_min, param.setting_a_max);
    const rangeB = getRangeText(param.setting_b_min, param.setting_b_max);
    const rangeC = getRangeCText(param);

    return (
      <tr key={param.id} className="border-b border-black">
        <td className="border-r border-black px-2 py-1 text-center"></td>
        <td className="border-r border-black px-2 py-1">
          {param.name ? (
            <>
              {param.name}
            </>
          ) : (
            <span className="text-gray-400 italic text-xs opacity-50">Parameter Setting</span>
          )}
        </td>
        <td className="border-r border-black px-2 py-1 text-center">{param.unit || ''}</td>
        <td className="border-r border-black px-2 py-1 text-center">{rangeA}</td>
        <td className="border-r border-black px-2 py-1 text-center">{rangeB}</td>
        <td className="border-r border-black px-2 py-1 text-center">{rangeC}</td>
        <td className="px-2 py-1 bg-blue-50/50 dark:bg-blue-900/10">
          <input
            type="number"
            step="any"
            value={value}
            onChange={e => handleChange(param.id, e.target.value)}
            className={`w-full bg-transparent outline-none text-center font-bold ${
              isError ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-700 dark:text-blue-400'
            }`}
            placeholder="..."
          />
        </td>
      </tr>
    );
  }
}
