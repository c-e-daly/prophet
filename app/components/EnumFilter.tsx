// EnumFilter.tsx - Refactored to use Polaris components
import React from 'react';
import { ChoiceList, Card, Text, ButtonGroup, Button, Spinner } from "@shopify/polaris";
import { useEnumContext } from '../context/enumsContext';

interface EnumFilterProps {
  enumKey: string;
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  allowMultiple?: boolean;
  showSelectAll?: boolean;
  cardWrapper?: boolean;
}

export function EnumFilter({ 
  enumKey,
  selectedValues, 
  onChange, 
  label,
  disabled = false,
  error,
  helpText,
  allowMultiple = true,
  showSelectAll = true,
  cardWrapper = true
}: EnumFilterProps) {
  const { enums, loading } = useEnumContext();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Spinner size="small" />
        <Text as="span" variant="bodyMd" tone="subdued">
          Loading {label || 'options'}...
        </Text>
      </div>
    );
  }

  const enumValues = enums[enumKey] || [];
  
  if (enumValues.length === 0) {
    return (
      <Text as="p" variant="bodyMd" tone="critical">
        No options available for {label || enumKey}
      </Text>
    );
  }

  const choices = enumValues.map(value => ({
    label: value,
    value: value,
  }));

  const handleSelectAll = () => {
    onChange(enumValues);
  };

  const handleSelectNone = () => {
    onChange([]);
  };

  const handleChoiceChange = (selected: string[]) => {
    onChange(selected);
  };

  const isAllSelected = selectedValues.length === enumValues.length;
  const isNoneSelected = selectedValues.length === 0;

  const choiceListComponent = (
    <>
      {showSelectAll && allowMultiple && (
        <div style={{ marginBottom: '12px' }}>
          <ButtonGroup segmented>
            <Button 
              onClick={handleSelectAll}
              disabled={disabled || isAllSelected}
              size="micro"
            >
              Select All
            </Button>
            <Button 
              onClick={handleSelectNone}
              disabled={disabled || isNoneSelected}
              size="micro"
            >
              Clear All
            </Button>
          </ButtonGroup>
        </div>
      )}
      
      <ChoiceList
        title={label}
        choices={choices}
        selected={selectedValues}
        onChange={handleChoiceChange}
        allowMultiple={allowMultiple}
        disabled={disabled}
        error={error}
      />
      
      {helpText && (
        <div style={{ marginTop: '8px' }}>
          <Text as="p" variant="bodyMd" color="subdued">
            {helpText}
          </Text>
        </div>
      )}
      
      {allowMultiple && (
        <div style={{ marginTop: '8px' }}>
          <Text as="p" variant="bodySm" color="subdued">
            {selectedValues.length} of {enumValues.length} selected
          </Text>
        </div>
      )}
    </>
  );

  // Wrap in Card if requested (useful for standalone filters)
  if (cardWrapper) {
    return (
      <Card>
        <div style={{ padding: '16px' }}>
          {choiceListComponent}
        </div>
      </Card>
    );
  }

  // Return bare component (useful when already inside a Card/Form)
  return <div>{choiceListComponent}</div>;
}

// Convenience hook for common filter operations
export function useEnumFilter(enumKey: string, initialValues: string[] = []) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(initialValues);
  
  const handleChange = React.useCallback((values: string[]) => {
    setSelectedValues(values);
  }, []);

  const handleReset = React.useCallback(() => {
    setSelectedValues([]);
  }, []);

  const hasFilters = selectedValues.length > 0;

  return {
    selectedValues,
    onChange: handleChange,
    onReset: handleReset,
    hasFilters,
  };
}

// Alternative compact version for inline filtering
interface EnumFilterCompactProps extends Omit<EnumFilterProps, 'cardWrapper' | 'showSelectAll'> {
  placeholder?: string;
}

export function EnumFilterCompact(props: EnumFilterCompactProps) {
  return (
    <EnumFilter 
      {...props}
      cardWrapper={false}
      showSelectAll={false}
    />
  );
}