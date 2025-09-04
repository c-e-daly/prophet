// app/lib/queries/getShopSingleOffer.ts
import type { Database } from "../../../supabase/database.types";
import { createClient } from "../../utils/supabase/server";

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

export type OfferMath = {
  offerPrice: number;        // merchant accepted amount
  cartPrice: number;         // cart/subtotal before allowance
  delta: number;             // cartPrice - offerPrice
  totalAllowances: number;   // distributed delta (sum of per-line allowances)
  totalMarkup: number;       // MMU dollars (settle - COGS)
  netSales: number;          // cartPrice (pre-allowance)
  norSales: number;          // settle total (net of allowance)
  netUnits: number;          // sum of quantities
  netItems: number;          // # rows (unique lines)
  grossMarginPct: number;    // totalMarkup / norSales
};

export type OfferLineItem = {
  status: "Selling" | "Settle";
  itemLabel: string;
  sku: string | null;
  qty: number;
  sellPrice: number;     // per unit (Selling row shows list, Settle row shows settle unit)
  cogs: number;          // per unit
  allowance: number;     // per unit (Selling row only)
  profit: number;        // per unit (MMU $)
  mmuPct: number;        // maintained markup %
  rowTotal: number;      // per unit settle
};

export type GetShopSingleOfferResult = {
  offer: OfferWithJoins;
  consumer12m: Tables<"consumer12m"> | null;
  math: OfferMath;
  lineItems: OfferLineItem[];
};

const n = (v: any) => Number(v ?? 0);

/**
 * getShopSingleOffer
 * Fetch a single offer (scoped to shopId) and compute financial rollups.
 */
export async function getShopSingleOffer(opts: {
  request: Request;
  shopsId: number;
  offerId: number;
}): Promise<GetShopSingleOfferResult> {
  const { request, shopsId, offerId } = opts;
  const supabase = createClient({ request });

  // Offer + joins
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
    .eq("shops", shopsId)
    .single();

  if (error || !offer) {
    throw new Error(error?.message ?? "Offer not found");
  }

  // Consumer KPIs (12m)
  let consumer12m: Tables<"consumer12m"> | null = null;
  if (offer.consumers?.id) {
    const { data } = await supabase
      .from("consumer12m")
      .select("*")
      .eq("consumer", offer.consumers.id)
      .eq("shops", shopsId)
      .maybeSingle();
    consumer12m = data ?? null;
  }

  // Financial math
  const offerPrice = n(offer.offerPrice); // your accepted price field
  const cartPrice =
    n(offer.carts?.cart_total) ||
    n(offer.carts?.subtotal) ||
    offerPrice;

  const items = (offer.cartitems ?? []).filter(Boolean);
  const netItems = items.length;
  const netUnits = items.reduce((s, it) => s + n(it.quantity ?? 1), 0);

  // Sum of pre-discount sell amounts (line list = unit sell * qty)
  const sumSell = items.reduce((s, it) => {
    const unitSell = n(it.sell_price ?? it.unit_price);
    const qty = n(it.quantity ?? 1);
    return s + unitSell * qty;
    }, 0);

  const delta = Math.max(cartPrice - offerPrice, 0); // total allowance to distribute
  const perLine: OfferLineItem[] = [];
  let totalAllowances = 0;
  let totalMarkup = 0;     // MMU $
  let settleTotal = 0;     // norSales

  for (const it of items) {
    const qty = n(it.quantity ?? 1);
    const unitSell = n(it.sell_price ?? it.unit_price);
    const unitCogs = n(it.cogs_unit);
    const lineSell = unitSell * qty;
    const lineAllowance = sumSell > 0 ? (lineSell / sumSell) * delta : 0;
    const unitAllowance = qty > 0 ? lineAllowance / qty : 0;

    const unitSettle = Math.max(unitSell - unitAllowance, 0);
    const unitProfit = unitSettle - unitCogs;
    const mmuPct = unitSettle > 0 ? unitProfit / unitSettle : 0;

    const itemLabel =
      it.item_name ??
      it.item_title ??
      it.variants?.title ??
      it.variants?.name ??
      "Item";

    // “Selling” row (list)
    perLine.push({
      status: "Selling",
      itemLabel,
      sku: it.sku ?? it.variants?.sku ?? null,
      qty,
      sellPrice: unitSell,
      cogs: unitCogs,
      allowance: unitAllowance,
      profit: unitProfit,
      mmuPct,
      rowTotal: unitSell, // list
    });

    // “Settle” row (after allowance)
    perLine.push({
      status: "Settle",
      itemLabel,
      sku: it.sku ?? it.variants?.sku ?? null,
      qty,
      sellPrice: unitSettle, // display settle in SELL PRICE col (to match your mock)
      cogs: unitCogs,
      allowance: 0,
      profit: unitProfit,
      mmuPct,
      rowTotal: unitSettle,  // settle
    });

    totalAllowances += lineAllowance;
    totalMarkup += unitProfit * qty;
    settleTotal += unitSettle * qty;
  }

  const norSales = settleTotal;  // net of allowances (maintained sales)
  const netSales = cartPrice;    // pre-discount list (cart)
  const grossMarginPct = norSales > 0 ? totalMarkup / norSales : 0;

  return {
    offer: offer as OfferWithJoins,
    consumer12m,
    math: {
      offerPrice,
      cartPrice,
      delta,
      totalAllowances,
      totalMarkup,
      netSales,
      norSales,
      netUnits,
      netItems,
      grossMarginPct,
    },
    lineItems: perLine,
  };
}
