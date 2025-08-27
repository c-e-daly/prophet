// app/routes/campaigns.new.tsx
import { EnumSelect } from '../components/EnumSelect';
import { useState } from 'react';

export default function NewCampaigns() {
  const [status, setStatus] = useState('');

  return (
    <div>
      <h1>New Campaign</h1>
      <form className="space-y-4">
        <EnumSelect
          enumKey="campaignStatus"
          value={status}
          onChange={setStatus}
          label="Status"
          required
        />
      </form>
    </div>
  );
}