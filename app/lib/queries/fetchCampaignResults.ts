export async function fetchCampaignResults({ campaignIds, status, dateRange, shopId }) {
  const supabase = createClientComponentClient();

  let query = supabase
    .from('campaignResults')
    .select('*')
    .in('campaign_id', campaignIds)
    .eq('shop_id', shopId);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (dateRange.startDate) {
    query = query.gte('start_date', dateRange.startDate);
  }

  if (dateRange.endDate) {
    query = query.lte('end_date', dateRange.endDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
