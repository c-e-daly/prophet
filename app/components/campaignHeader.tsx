import { useEffect, useState } from 'react';
import Select from 'react-select';
import { createBrowserClient } from '@supabase/ssr';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export default function CampaignHeader({ shopId, onFilterSubmit }) {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

  const [campaignOptions, setCampaignOptions] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [status, setStatus] = useState('all');

  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    async function fetchCampaigns() {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('shop_id', shopId);

      if (!error && data) {
        const options = data.map(c => ({
          value: c.id,
          label: c.name
        }));
        setCampaignOptions(options);
      }

      setLoading(false);
    }

    fetchCampaigns();
  }, [shopId]);

  function handleCampaignChange(selected) {
    setSelectedCampaigns(selected);
  }

  function handleSubmit() {
    const campaignIds = selectedCampaigns.map(c => c.value);
    const startDate = dateRange[0]?.startDate?.toISOString() || null;
    const endDate = dateRange[0]?.endDate?.toISOString() || null;

    onFilterSubmit({
      campaignIds,
      status,
      dateRange: { startDate, endDate }
    });
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Filter Campaign Results</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium">Campaign(s)</label>
        <Select
          options={campaignOptions}
          isMulti
          value={selectedCampaigns}
          onChange={handleCampaignChange}
          isDisabled={loading}
          placeholder="Select one or more campaigns"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Date Range</label>
        <DateRange
          editableDateInputs={true}
          onChange={item => setDateRange([item.selection])}
          moveRangeOnFirstSelection={false}
          ranges={dateRange}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        disabled={selectedCampaigns.length === 0}
      >
        Get Campaign Results
      </button>
    </div>
  );
}
