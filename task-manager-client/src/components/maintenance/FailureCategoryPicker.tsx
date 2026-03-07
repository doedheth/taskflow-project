import type { FailureCode } from '../../types';

type Props = {
  failureCodes: FailureCode[];
  selected: string | null;
  onSelect: (category: string) => void;
};

export default function FailureCategoryPicker({ failureCodes, selected, onSelect }: Props) {
  const categories = Array.from(
    new Set(failureCodes.map(fc => fc.category).filter(Boolean))
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`p-6 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 group min-h-[100px] flex flex-col justify-center ${
            selected === cat
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md'
              : 'border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 hover:border-purple-500 hover:shadow-lg'
          }`}
        >
          <div className={`text-lg font-bold mb-1 ${
            selected === cat 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-gray-800 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300'
          }`}>
            {cat}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Pilih Kategori</div>
        </button>
      ))}
    </div>
  );
}
