// app/lib/queries/getShopDashboardData.ts
import  createClient  from "../../../../supabase/server";
import type { Database } from "../../../../supabase/database.types"; 

type OrdersRow = Database["public"]["Tables"]["orders"]["Row"];

type Summary = {
  order_count: number;
  gross_sales: number;
  nor_sales: number; // gross + shipping - discounts
  consumers: number; // distinct consumer count
  aov: number;       // gross / orders (0 if no orders)
};

export type DashboardSalesSummary = {
  today: Summary;
  wtd: Summary;
  mtd: Summary;
  ytd: Summary;
  nor_by_month: Array<{ date: string; cy: number; py: number }>;
  nor_by_week_13: Array<{ date: string; cy: number }>;
};

/** Utilities */
const toNum = (v: number | null) => (v ?? 0);
const nor = (o: OrdersRow) =>
  toNum(o.grossSales) + toNum(o.grossShippingSales) - toNum(o.grossDiscounts);
const gross = (o: OrdersRow) => toNum(o.grossSales) + toNum(o.grossShippingSales);

function makeSummary(rows: OrdersRow[]): Summary {
  const order_count = rows.length;
  const gross_sum = rows.reduce((s, r) => s + gross(r), 0);
  const nor_sum   = rows.reduce((s, r) => s + nor(r), 0);
  const consumers = new Set(rows.map(r => r.consumers).filter(Boolean)).size;
  const aov = order_count === 0 ? 0 : gross_sum / order_count;
  return { order_count, gross_sales: gross_sum, nor_sales: nor_sum, consumers, aov };
}

function startOfUTCDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function startOfUTCMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}
// Match Postgres date_trunc('week', ...) which starts weeks on Monday
function startOfUTCWeekMonday(d: Date) {
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const mondayOffset = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  monday.setUTCDate(monday.getUTCDate() - mondayOffset);
  return monday;
}
function startOfUTCYear(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

function yyyymmdd(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function yyyymm01(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export async function getDashboardSummary(
  shopsId: number,
): Promise<DashboardSalesSummary> {
  const supabase = createClient();
              
  if (shopsId == null) {
    // match your SQL function behavior
    return {
      today: { order_count: 0, gross_sales: 0, nor_sales: 0, consumers: 0, aov: 0 },
      wtd:   { order_count: 0, gross_sales: 0, nor_sales: 0, consumers: 0, aov: 0 },
      mtd:   { order_count: 0, gross_sales: 0, nor_sales: 0, consumers: 0, aov: 0 },
      ytd:   { order_count: 0, gross_sales: 0, nor_sales: 0, consumers: 0, aov: 0 },
      nor_by_month: [],
      nor_by_week_13: [],
    };
  }

  // 2) Date windows
  const now = new Date();
  const startToday = startOfUTCDay(now);
  const startWeek  = startOfUTCWeekMonday(now);
  const startMonth = startOfUTCMonth(now);
  const startYTD   = startOfUTCYear(now);

  const startPrevYear = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
  const endPrevYear   = startYTD;

  const start13Weeks = new Date(startWeek.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

  // 3) Fetch data (minimize round-trips)
  const [ytdRes, prevYearRes, last13Res] = await Promise.all([
    supabase
      .from("orders")
      .select("id, created_at, consumer, grossSales, grossShippingSales, grossDiscounts")
      .eq("shop", shopsId)
      .gte("created_at", startYTD.toISOString()) as any,
    supabase
      .from("orders")
      .select("id, created_at, consumer, grossSales, grossShippingSales, grossDiscounts")
      .eq("shop", shopsId)
      .gte("created_at", startPrevYear.toISOString())
      .lt("created_at", endPrevYear.toISOString()) as any,
    supabase
      .from("orders")
      .select("id, created_at, consumer, grossSales, grossShippingSales, grossDiscounts")
      .eq("shop", shopsId)
      .gte("created_at", start13Weeks.toISOString()) as any,
  ]);

  if (ytdRes.error)  throw new Error(`YTD orders error: ${ytdRes.error.message}`);
  if (prevYearRes.error) throw new Error(`PY orders error: ${prevYearRes.error.message}`);
  if (last13Res.error)   throw new Error(`13w orders error: ${last13Res.error.message}`);

  const ordersYTD: OrdersRow[]      = (ytdRes.data ?? []).filter(o => o.created_at != null);
  const ordersPrevYear: OrdersRow[] = (prevYearRes.data ?? []).filter(o => o.created_at != null);
  const orders13w: OrdersRow[]      = (last13Res.data ?? []).filter(o => o.created_at != null);

  // 4) Build summaries
  const isOnOrAfter = (d: Date) => (o: OrdersRow) => new Date(o.created_at!) >= d;

  const today = makeSummary(ordersYTD.filter(isOnOrAfter(startToday)));
  const wtd   = makeSummary(ordersYTD.filter(isOnOrAfter(startWeek)));
  const mtd   = makeSummary(ordersYTD.filter(isOnOrAfter(startMonth)));
  const ytd   = makeSummary(ordersYTD);

  // 5) NOR by month (CY vs PY) — Jan..current month, ascending
  const months: Date[] = [];
  {
    const first = startOfUTCYear(now);
    for (let m = 0; m <= now.getUTCMonth(); m++) {
      months.push(new Date(Date.UTC(first.getUTCFullYear(), m, 1)));
    }
  }

  const nor_by_month = months.map((mDate) => {
    const next = new Date(Date.UTC(mDate.getUTCFullYear(), mDate.getUTCMonth() + 1, 1));
    const cySum = ordersYTD
      .filter(o => new Date(o.created_at!) >= mDate && new Date(o.created_at!) < next)
      .reduce((s, r) => s + nor(r), 0);

    const pyMonth = new Date(Date.UTC(mDate.getUTCFullYear() - 1, mDate.getUTCMonth(), 1));
    const pyNext  = new Date(Date.UTC(pyMonth.getUTCFullYear(), pyMonth.getUTCMonth() + 1, 1));
    const pySum = ordersPrevYear
      .filter(o => new Date(o.created_at!) >= pyMonth && new Date(o.created_at!) < pyNext)
      .reduce((s, r) => s + nor(r), 0);

    return { date: yyyymm01(mDate), cy: cySum, py: pySum };
  });

  // 6) NOR by week (last 13 weeks including current), ascending
  const weeksAsc: Date[] = [];
  {
    const start = start13Weeks; // already Monday
    for (let i = 0; i < 13; i++) {
      const w = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      weeksAsc.push(w);
    }
  }

  const nor_by_week_13 = weeksAsc.map((wDate) => {
    const next = new Date(wDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const cySum = orders13w
      .filter(o => new Date(o.created_at!) >= wDate && new Date(o.created_at!) < next)
      .reduce((s, r) => s + nor(r), 0);
    return { date: yyyymmdd(wDate), cy: cySum };
  });

  return { today, wtd, mtd, ytd, nor_by_month, nor_by_week_13 };
}
