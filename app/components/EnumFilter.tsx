// app/components/EnumFilter.tsx
import React from 'react';
import { useEnumContext } from '../context/enumsContext';

interface EnumFilterProps {
  enumKey: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  label?: string;
  className?: string;
  maxHeight?: string;
}

export function EnumFilter({ 
  enumKey,
  selectedValues,
  onChange,
  label,
  className = "",
  maxHeight = "200px"
}: EnumFilterProps) {
  const { enums, loading } = useEnumContext();
  const options = enums[enumKey] || [];

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  };

  const handleSelectAll = () => {
    onChange(options);
  };

  const handleSelectNone = () => {
    onChange([]);
  };

  if (loading) return <div className={className}>Loading filters...</div>;

  if (options.length === 0) {
    return <div className={className}>No filter options available</div>;
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      
      {/* Select All/None buttons */}
      <div className="flex gap-2 mb-2">
        <button 
          type="button"
          onClick={handleSelectAll}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          All
        </button>
        <button 
          type="button"
          onClick={handleSelectNone}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          None
        </button>
      </div>

      {/* Checkbox list */}
      <div 
        className="space-y-2 overflow-y-auto border rounded p-2"
        style={{ maxHeight }}
      >
        {options.map((option) => (
          <label key={option} className="flex items-center hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={(e) => handleCheckboxChange(option, e.target.checked)}
              className="mr-2 text-blue-600"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
      
      {/* Selected count */}
      {selectedValues.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {selectedValues.length} of {options.length} selected
        </div>
      )}
    </div>
  );
}