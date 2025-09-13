// app/components/pricebuilder/pricingMath.ts
export function roundToCharm(x: number): number {
// Round UP to the nearest *.99 or *.49 ending that lands on a 9.99 step if > $10.
// Simple v1: round up to nearest 9.99 within the current decade (10s bucket).
if (x < 10) {
return Math.ceil(x) - 0.01; // e.g., 7.13 => 8.99
}
const decade = Math.floor(x / 10) * 10; // 27.35 => 20
const candidates = [decade + 9.99, decade + 19.99, decade + 29.99, decade + 39.99, decade + 49.99, decade + 59.99, decade + 69.99, decade + 79.99, decade + 89.99, decade + 99.99];
for (const c of candidates) {
if (c >= x - 1e-6) return c; // first charm >= x
}
return candidates[candidates.length - 1];
}


export function computeEffectivePrice(opts: any): number {
const { mode, row } = opts;
const cogs = Number(opts.cogs ?? row.cogs ?? 0); // if you store cogs in catalog, pick here
const current = Number(row.currentPrice ?? 0);


if (mode === 'single') {
const profit = Number(opts.profitMarkup || 0);
const aDisc = Number(opts.allowanceDiscounts || 0);
const aShrink = Number(opts.allowanceShrink || 0);
const aFin = Number(opts.allowanceFinancing || 0);
const aShip = Number(opts.allowanceShipping || 0);
const base = cogs + profit + aDisc + aShrink + aFin + aShip;
const target = base + Number(opts.marketAdjustment || 0);
return Math.max(target, 0);
}


// mode === 'bulk' => % of COGS unless otherwise noted
const pProfit = Number(opts.profitMarkupPct || 0) / 100;
const pDisc = Number(opts.allowanceDiscountsPct || 0) / 100;
const pShrink = Number(opts.allowanceShrinkPct || 0) / 100;
const pFin = Number(opts.allowanceFinancingPct || 0) / 100;
const pShip = Number(opts.allowanceShippingPct || 0) / 100;


const base = cogs * (1 + pProfit + pDisc + pShrink + pShip);
const withFin = base * (1 + pFin); // if financing scales with price
const charmed = roundToCharm(withFin);
return Math.max(charmed, 0);
}