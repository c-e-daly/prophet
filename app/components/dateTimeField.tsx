// app/components/DateTimeField.tsx
import * as React from "react";
import { TextField, InlineStack } from "@shopify/polaris";

type DateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (isoString: string) => void;
};

export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  // Parse initial value once
  const [dateVal, timeVal] = React.useMemo(() => {
    if (!value) return ["", "12:00"];
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return ["", "12:00"];
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    return [dateStr, timeStr];
  }, [value]);

  const handleDateChange = (newDate: string) => {
    if (newDate && timeVal) {
      const iso = new Date(`${newDate}T${timeVal}:00`).toISOString();
      onChange(iso);
    } else {
      onChange("");
    }
  };

  const handleTimeChange = (newTime: string) => {
    if (dateVal && newTime) {
      const iso = new Date(`${dateVal}T${newTime}:00`).toISOString();
      onChange(iso);
    } else {
      onChange("");
    }
  };

  return (
    <InlineStack gap="200">
      <TextField
        label={`${label} (Date)`}
        type="date"
        value={dateVal}
        onChange={handleDateChange}
        autoComplete="off"
      />
      <TextField
        label={`${label} (Time)`}
        type="time"
        value={timeVal}
        onChange={handleTimeChange}
        autoComplete="off"
      />
    </InlineStack>
  );
}