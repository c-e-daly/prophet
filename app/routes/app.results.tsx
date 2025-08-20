

import { useState } from 'react';
import { getShopCampaignResults } from '../lib/queries/getShopCampaignResults';

export default function Results() {
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState(null);
  const shopId = 'your-current-shop-id'; // Replace with real shop context

  async function handleFilterSubmit({ campaignIds, status, dateRange }) {
    const data = await getShopCampaignResults({
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

      {/* Display results after filtering */}
    </div>
  );
}
