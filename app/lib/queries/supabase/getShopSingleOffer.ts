// app/lib/queries/getShopSingleOffer.ts
import type { Database } from "../../../../supabase/database.types";
import createClient from "../../../utils/supabase/server";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type OfferWithJoins = Tables<"offers"> & {
  carts: Tables<"carts"> | null;
  consumers: Tables<"consumers"> | null;
  campaigns: Tables<"campaigns"> | null;
  programs: Tables<"programs"> | null;
  cartitems: (Tables<"cartitems"> & {
    variants: Tables<"variants"> | null;
  })[];
};

export type OfferLineItem = {
  // for rendering both “Selling” and “Settle” lines in your table
  status: "Selling" | "Settle";
  itemLabel: string;
  sku: string | null;
  qty: number
  variantCost: number;
  profitMarkup: number;
  marketAdjust: number;
  allowanceShrink: number;
  allowanceDiscounts: number;
  allowanceShipping: number;
  allowanceFinancing: number;
  allowanceOther: number;
  totalAllowances: number; // sum of allowances columns
  sellPrice: number;       // variantCost + profitMarkup + totalAllowances + marketAdjust
  settlePrice: number;     // sellPrice after discount allocation (same as rowTotal in UI
  cogs: number;            // per-unit cost (variantCost)
  profit: number;          // per-unit profit markup AFTER deduction on Settle, BEFORE on Selling
  allowancePerUnit: number; // per-unit combined allowance shown on “Selling” line
  mmuPct: number;          // profit / settlePrice (on Settle line)
};

export type OfferMath = {
  offerPrice: number;
  cartPrice: number;        // pre-discount total
  offerDiscountPrice: number; // cartPrice - offerPrice
  netSales: number;         // cartPrice
  norSales: number;         // sum of (settlePrice * qty)
  netUnits: number;
  netItems: number;
  totalAllowances: number;  // sum of post-deduction allowances
  totalMarkup: number;      // sum of post-deduction profitMarkup
  grossMarginPct: number;   // totalMarkup / norSales
};

export type GetShopSingleOfferResult = {
  offer: OfferWithJoins;
  consumerShop12m: Tables<"consumerShop12m"> | null;
  math: OfferMath;
  lineItems: OfferLineItem[]; // already includes Selling + Settle rows
};

const n = (v: any) => Number(v ?? 0);

type WorkingItem = {
  key: string; // stable key
  qty: number;

  // original per-unit components
  cost: number;
  profit: number;
  market: number;
  aShrink: number;
  aDiscounts: number;
  aShipping: number;
  aFinancing: number;
  aOther: number;

  // derived
  totalAllow: number; // allowances sum (per-unit)
  sell: number;       // per-unit selling price

  // mutable copies for settlement (per-unit)
  p_profit: number;
  p_market: number;
  p_aShrink: number;
  p_aDiscounts: number;
  p_aShipping: number;
  p_aFinancing: number;
  p_aOther: number;
};

function buildWorkingItems(offer: OfferWithJoins): WorkingItem[] {
  const items = (offer.cartitems ?? []).filter(Boolean);
  return items.map((it, idx) => {
    const v = it.variants ?? ({} as any);

    const cost       = n(v.variantCost ?? v.cost ?? it.cogs_unit);
    const profit     = n(v.profitMarkup ?? v.mmu ?? 0);
    const market     = n(v.marketAdjust ?? 0);
    const aShrink    = n(v.allowanceShrink ?? 0);
    const aDiscounts = n(v.allowanceDiscounts ?? 0);
    const aShipping  = n(v.allowanceShipping ?? 0);
    const aFinancing = n(v.allowanceFinancing ?? 0);
    const aOther     = n(v.allowanceOther ?? 0);

    const totalAllow = aShrink + aDiscounts + aShipping + aFinancing + aOther;
    const sell       = cost + profit + totalAllow + market;

    const qty = n(it.variantQuantity ?? 1);

    return {
      key: String(idx),
      qty,
      cost,
      profit,
      market,
      aShrink,
      aDiscounts,
      aShipping,
      aFinancing,
      aOther,
      totalAllow,
      sell,

      // post-deduction mutable copies
      p_profit: profit,
      p_market: market,
      p_aShrink: aShrink,
      p_aDiscounts: aDiscounts,
      p_aShipping: aShipping,
      p_aFinancing: aFinancing,
      p_aOther: aOther,
    };
  });
}

/**
 * Pro-rata allocate `amount` across items by the size of `weight(item)` * qty.
 * Returns per-item allocated amounts and the leftover (if pool < amount).
 */
function allocate(amount: number, items: WorkingItem[], weight: (wi: WorkingItem) => number) {
  const weights = items.map((wi) => weight(wi) * wi.qty);
  const total = weights.reduce((s, w) => s + w, 0);
  if (amount <= 0 || total <= 0) return { allocations: items.map(() => 0), leftover: amount };

  let remaining = amount;
  const allocations = weights.map((w) => {
    const share = (w / total) * amount;
    const alloc = Math.min(share, remaining);
    remaining -= alloc;
    return alloc;
  });

  // numerical drift safety
  if (Math.abs(remaining) < 1e-6) remaining = 0;

  return { allocations, leftover: remaining };
}

export async function getShopSingleOffer(opts: {
  request: Request;
  shopId: number;
  offerId: number;
}): Promise<GetShopSingleOfferResult> {
  const { request, shopId, offerId } = opts;
  const supabase = createClient({ request });

  // offer + joins
  const { data: offer, error } = await supabase
    .from("offers")
    .select(`
      *,
      carts (*),
      consumers (*),
      campaigns (*),
      programs (*),
      cartitems (
        *,
        variants (*)
      )
    `)
    .eq("id", offerId)
    .eq("shop", shopId)
    .single();

  if (error || !offer) throw new Error(error?.message ?? "Offer not found");

  // consumer KPIs
  let consumerShop12m: Tables<"consumerShop12m"> | null = null;
  if (offer.consumers?.id) {
    const { data } = await supabase
      .from("consumerShop12m")
      .select("*")
      .eq("consumer", offer.consumers.id)
      .eq("shop", shopId)
      .maybeSingle();
    consumerShop12m = data ?? null;
  }

  // Build working set
  const W = buildWorkingItems(offer);

  // Totals
  const netItems = W.length;
  const netUnits = W.reduce((s, wi) => s + wi.qty, 0);

  // Prices
  const cartPrice =
    n(offer.carts?.cartTotalPrice ?? offer.carts?.subtotal ?? 0) ||
    W.reduce((s, wi) => s + wi.sell * wi.qty, 0); // fallback if cart is empty

  const offerPrice = n(offer.offerPrice ?? offer.settlePrice ?? 0);
  const offerDiscountPrice = Math.max(cartPrice - offerPrice, 0);

  // Step 1: deduct from (totalAllowances + marketAdjust) pool
  const poolAWeight = (wi: WorkingItem) => wi.totalAllow + wi.market;
  const { allocations: allocA, leftover: afterA } = allocate(offerDiscountPrice, W, poolAWeight);

  // Apply step 1 to each item:
  // We reduce each item’s allowances + market proportionally.
  // Within the item, split the item’s A-allocation across allowances and market
  // proportionally to their shares.
  W.forEach((wi, i) => {
    const alloc = allocA[i];           // total dollars taken from this item’s (allow+market) *qty
    if (alloc <= 0) return;

    const poolUnit = wi.totalAllow + wi.market; // per unit
    const poolLine = poolUnit * wi.qty;         // line total
    if (poolLine <= 0) return;

    // Fractions within (allowances vs market)
    const allowLine = wi.totalAllow * wi.qty;
    const marketLine = wi.market * wi.qty;

    const takeFromAllow = Math.min(alloc * (allowLine / poolLine), allowLine);
    const takeFromMarket = Math.min(alloc - takeFromAllow, marketLine);

    // Split allow deduction across components by their relative shares
    const A = {
      shrink: wi.p_aShrink * wi.qty,
      discounts: wi.p_aDiscounts * wi.qty,
      shipping: wi.p_aShipping * wi.qty,
      financing: wi.p_aFinancing * wi.qty,
      other: wi.p_aOther * wi.qty,
    };
    const allowTotalLine = A.shrink + A.discounts + A.shipping + A.financing + A.other;

    const takeShare = (part: number) => (allowTotalLine > 0 ? (part / allowTotalLine) * takeFromAllow : 0);

    // apply to per-unit mutable values
    wi.p_aShrink    = Math.max(0, (A.shrink - takeShare(A.shrink)) / wi.qty);
    wi.p_aDiscounts = Math.max(0, (A.discounts - takeShare(A.discounts)) / wi.qty);
    wi.p_aShipping  = Math.max(0, (A.shipping - takeShare(A.shipping)) / wi.qty);
    wi.p_aFinancing = Math.max(0, (A.financing - takeShare(A.financing)) / wi.qty);
    wi.p_aOther     = Math.max(0, (A.other - takeShare(A.other)) / wi.qty);

    wi.p_market     = Math.max(0, (marketLine - takeFromMarket) / wi.qty);
  });

  // Step 2: if needed, deduct the remainder from profitMarkup
  if (afterA > 0) {
    const poolPWeight = (wi: WorkingItem) => wi.p_profit; // use current profit (per unit)
    const { allocations: allocP } = allocate(afterA, W, poolPWeight);

    W.forEach((wi, i) => {
      const alloc = allocP[i];
      if (alloc <= 0) return;
      const profitLine = wi.p_profit * wi.qty;
      const newProfitLine = Math.max(0, profitLine - alloc);
      wi.p_profit = newProfitLine / wi.qty;
    });
  }

  // Build line items (Selling + Settle)
  const lineItems: OfferLineItem[] = [];
  let totalAllowancesPost = 0;
  let totalMarkupPost = 0;
  let norSales = 0;

  W.forEach((wi) => {
    const totalAllowPost =
      wi.p_aShrink + wi.p_aDiscounts + wi.p_aShipping + wi.p_aFinancing + wi.p_aOther;

    const sellUnit = wi.cost + wi.profit + wi.totalAllow + wi.market; // original
    const settleUnit = wi.cost + wi.p_profit + totalAllowPost + wi.p_market;

    const mmuPct = settleUnit > 0 ? (wi.p_profit / settleUnit) : 0;

    // Selling row (pre-deduction view)
    lineItems.push({
      status: "Selling",
      itemLabel: "", // fill below
      sku: "",
      qty: wi.qty,
      variantCost: wi.cost,
      profitMarkup: wi.profit,
      marketAdjust: wi.market,
      allowanceShrink: wi.aShrink,
      allowanceDiscounts: wi.aDiscounts,
      allowanceShipping: wi.aShipping,
      allowanceFinancing: wi.aFinancing,
      allowanceOther: wi.aOther,
      totalAllowances: wi.totalAllow,
      sellPrice: sellUnit,
      settlePrice: sellUnit, // for Selling row we mirror sell
      cogs: wi.cost,
      profit: wi.profit,
      allowancePerUnit: wi.totalAllow,
      mmuPct: (sellUnit > 0 ? wi.profit / sellUnit : 0),
    });

    // Settle row (post-deduction/balances)
    lineItems.push({
      status: "Settle",
      itemLabel: "", // fill below
      sku: "",
      qty: wi.qty,
      variantCost: wi.cost,
      profitMarkup: wi.p_profit,
      marketAdjust: wi.p_market,
      allowanceShrink: wi.p_aShrink,
      allowanceDiscounts: wi.p_aDiscounts,
      allowanceShipping: wi.p_aShipping,
      allowanceFinancing: wi.p_aFinancing,
      allowanceOther: wi.p_aOther,
      totalAllowances: totalAllowPost,
      sellPrice: settleUnit,  // shows as “SELL PRICE” per your mock
      settlePrice: settleUnit,
      cogs: wi.cost,
      profit: wi.p_profit,
      allowancePerUnit: totalAllowPost, // for Settle display we can show remaining allowance
      mmuPct,
    });

    totalAllowancesPost += totalAllowPost * wi.qty;
    totalMarkupPost += wi.p_profit * wi.qty;
    norSales += settleUnit * wi.qty;
  });

  // backfill label/sku from the original cartitems
  (offer.cartitems ?? []).forEach((it, idx) => {
    const v = it.variants ?? ({} as any);
    const label =
      it.item_name ?? it.item_title ?? v.title ?? v.name ?? "Item";
    const sku = it.sku ?? v.sku ?? null;

    // Selling/Settle rows are pushed in pairs for each idx
    const sIndex = idx * 2;
    if (lineItems[sIndex]) {
      lineItems[sIndex].itemLabel = label;
      lineItems[sIndex].sku = sku;
    }
    if (lineItems[sIndex + 1]) {
      lineItems[sIndex + 1].itemLabel = label;
      lineItems[sIndex + 1].sku = sku;
    }
  });

  const netSales = cartPrice;
  const grossMarginPct = norSales > 0 ? totalMarkupPost / norSales : 0;

  return {
    offer: offer as OfferWithJoins,
    consumerShop12m,
    math: {
      offerPrice,
      cartPrice,
      offerDiscountPrice,
      netSales,
      norSales,
      netUnits,
      netItems,
      totalAllowances: totalAllowancesPost,
      totalMarkup: totalMarkupPost,
      grossMarginPct,
    },
    lineItems,
  };
}
