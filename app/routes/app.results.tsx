
import CampaignHeader from '../components/campaignHeader';
import { useState } from 'react';
import { fetchCampaignResults } from '../lib/queries/fetchCampaignResults';

export default function Results() {
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState(null);
  const shopId = 'your-current-shop-id'; // Replace with real shop context

  async function handleFilterSubmit({ campaignIds, status, dateRange }) {
    const data = await fetchCampaignResults({
      campaignIds,
      status,
      dateRange,
      shopId
    });

    setResults(data);
    setFilters({ campaignIds, status, dateRange });
  }

  return (
    <div className="space-y-6 p-6">
      <CampaignHeader shopId={shopId} onFilterSubmit={handleFilterSubmit} />
      {/* Display results after filtering */}
    </div>
  );
}
