export async function createCampaign(payload) {
  const res = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create campaign");
  return await res.json();
}

export async function fetchEnumOptions() {
  return {
    types: [
      { label: "Acquisition", value: "ACQUISITION" },
      { label: "Retention", value: "RETENTION" },
    ],
    metrics: [
      { label: "Conversion Rate", value: "CONVERSION_RATE" },
      { label: "Average Order Value", value: "AOV" },
    ],
  };
}
