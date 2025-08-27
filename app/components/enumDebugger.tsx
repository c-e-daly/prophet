// app/components/EnumDebugger.tsx (for development)
import React from 'react';
import { useEnumContext } from '../context/enumsContext';

export function EnumDebugger() {
  const { enums, loading, error, refresh, enumKeys } = useEnumContext();

  if (loading) return <div>Loading enums...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Enum Debugger</h3>
        <button 
          onClick={refresh}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Cache
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {enumKeys.map(enumKey => (
          <div key={enumKey} className="p-3 bg-white rounded border">
            <h4 className="font-medium text-sm text-gray-900 mb-2">{enumKey}</h4>
            <div className="space-y-1">
              {enums[enumKey].map(value => (
                <div key={value} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {value}
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {enums[enumKey].length} values
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}