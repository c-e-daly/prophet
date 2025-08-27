// app/components/EnumSelect.tsx
import React from 'react';
import { useEnumContext } from '../context/enumsContext';

interface EnumSelectProps {
  enumKey: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export function EnumSelect({ 
  enumKey,
  value, 
  onChange, 
  placeholder = "Select an option",
  className = "",
  disabled = false,
  required = false,
  label
}: EnumSelectProps) {
  const { enums, loading } = useEnumContext();
  
  const options = enums[enumKey] || [];

  if (loading) {
    return (
      <div className={className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <select disabled className="w-full p-2 border rounded bg-gray-50">
          <option>Loading...</option>
        </select>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <select disabled className="w-full p-2 border rounded bg-gray-50">
          <option>No options available</option>
        </select>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <select 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {!required && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}