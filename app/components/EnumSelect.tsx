// EnumSelect.tsx - Updated to use Polaris
import React from 'react';
import { Select } from "@shopify/polaris";
import { useEnumContext } from '../context/enumsContext';

interface EnumSelectProps {
  enumKey: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  includeEmpty?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
}

export function EnumSelect({ 
  enumKey,
  value, 
  onChange, 
  label,
  includeEmpty = false,
  disabled = false,
  error,
  helpText
}: EnumSelectProps) {
  const { enums, loading } = useEnumContext();
  
  if (loading) {
    return <Select label={label || "Loading..."} options={[]} disabled />;
  }

  const enumValues = enums[enumKey] || [];
  const options = [
    ...(includeEmpty ? [{ label: "Select an option", value: "" }] : []),
    ...enumValues.map(val => ({ label: val, value: val }))
  ];

  return (
    <Select
      label={label}
      options={options}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      error={error}
      helpText={helpText}
    />
  );
}