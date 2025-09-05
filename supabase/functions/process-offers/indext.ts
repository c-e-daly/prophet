// supabase/functions/process-offers/index.ts
// Deno Edge Function (Supabase). Deploy with: supabase functions deploy process-offers
// Invoke at:   https://<YOUR-PROJECT-REF>.functions.supabase.co/process-offers

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type OfferPayload = {
  storeUrl: string;
  consumerName: string;
  consumerEmail: string;
  consumerMobile?: string | null;
  consumerPostalCode?: string | null;
  currency: string;
  offerPrice: string;                // "750.00"
  tosChecked: boolean;
  tosCheckedDate: string;            // ISO
  cartToken: string;
  cartCreateDate: string;            // ISO
  cartUpdateDate: string;            // ISO
  offerCreateDate: string;           // ISO
  cartComposition: string;
  items: Array<{
    productID: number;
    productName: string;
    productURL: string;
    variantID: number;
    sku?: string | null;
    quantity: number;
    price: number;                   // unit price
    lineTotal: number;
    cartToken: string;
    template?: string | null;
  }>;
  cartItems: number;
  cartUnits: number;
  cartTotalPrice: string;            // "759.98"
};

type ProcessOfferResult = {
  decision: "Accepted" | "Declined";
  reason?: string;
  discountCode?: string;
  discountAmount?: number;           // cents
  customerGID?: string;
  offerId?: number;
  cartId?: number;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_API_KEY = Deno.env.get("IWT_PUBLIC_API_KEY") || ""; // optional shared key header
const API_VERSION = "2024-10"; // Shopify Admin GraphQL version

// Module-scoped client (consistent with your style)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ----- small utils -----
const json = (status: number, body: Json, extraHeaders: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",        // tighten if desired
      "Access-Control-Allow-Headers": "content-type,x-iwt-key",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      ...extraHeaders,
    },
  });

const toCents = (s: string | number | null | undefined) =>
  Math.round(Number(s ?? 0) * 100);

const safeStr = (s: unknown) => (s == null ? "" : String(s));

// ----- Shopify helpers (direct, no local helpers) -----
async function getShopifyAuthByDomain(shopDomain: string): Promise<{ shopsId: number; shopDomain: string; accessToken: string }> {
  // shops
  const shopRes = await supabase
    .from("shops")
    .select("id, shopDomain")
    .eq("shopDomain", shopDomain)
    .single();
  if (shopRes.error || !shopRes.data) throw new Error("shop_not_found");

  const shopsId = shopRes.data.id as number;

  // shopAuths
  const authRes = await supabase
    .from("shopAuths")
    .select("accessToken")
    .eq("shop", shopsId)
    .single();
  if (authRes.error || !authRes.data) throw new Error("shop_auth_not_found");

  return { shopsId, shopDomain: shopRes.data.shopDomain as string, accessToken: authRes.data.accessToken as string };
}

async function getOrCreateShopifyCustomer(auth: { shopDomain: string; accessToken: string }, payload: OfferPayload): Promise<{ customerGID: string }> {
  // 1) try lookup by email
  const q = `
    query getCustomer($query: String!) {
      customers(first: 1, query: $query) {
        edges { node { id email } }
      }
    }`;
  const v = { query: `email:${JSON.stringify(payload.consumerEmail)}` };
  const r1 = await fetch(`https://${auth.shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": auth.accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: q, variables: v }),
  });
  const j1 = await r1.json();
  const existing = j1?.data?.customers?.edges?.[0]?.node?.id as string | undefined;
  if (existing) return { customerGID: existing };

  // 2) create if not found
  const m = `
    mutation createCustomer($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer { id email }
        userErrors { field message }
      }
    }`;
  const name = safeStr(payload.consumerName).trim();
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ") || undefined;

  const r2 = await fetch(`https://${auth.shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": auth.accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: m,
      variables: {
        input: {
          email: payload.consumerEmail,
          firstName: firstName || undefined,
          lastName,
          phone: payload.consumerMobile || undefined,
          addresses: payload.consumerPostalCode ? [{ zip: payload.consumerPostalCode }] : undefined,
        },
      },
    }),
  });
  const j2 = await r2.json();
  const gid = j2?.data?.customerCreate?.customer?.id as string | undefined;
  if (!gid) {
    const err = j2?.data?.customerCreate?.userErrors?.map((e: any) => e.message).join("; ");
    throw new Error(`shopify_customer_create_failed: ${err || "unknown"}`);
  }
  return { customerGID: gid };
}

async function createShopifyDiscount(
  auth: { shopDomain: string; accessToken: string },
  params: { title: string; code: string; amountCents: number; startsAtISO?: string }
): Promise<{ discountGID: string; code: string }> {
  // NOTE: adjust this mutation to your prod scheme if needed
  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode { id }
        userErrors { field message }
      }
    }`;

  const variables = {
    basicCodeDiscount: {
      title: params.title,
      startsAt: params.startsAtISO ?? new Date().toISOString(),
      customerSelection: { all: true }, // or target by customer if you prefer
      codes: [params.code],
      discount: {
        value: { fixedAmountValue: { amount: (params.amountCents / 100).toFixed(2) } },
        appliesOncePerCustomer: true,
      },
    },
  };

  const res = await fetch(`https://${auth.shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": auth.accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: mutation, variables }),
  });
  const json = await res.json();
  const nodeId = json?.data?.discountCodeBasicCreate?.codeDiscountNode?.id as string | undefined;
  const err = json?.data?.discountCodeBasicCreate?.userErrors?.[0]?.message as string | undefined;
  if (!nodeId) throw new Error(`shopify_discount_create_failed: ${err || "unknown"}`);
  return { discountGID: nodeId, code: params.code };
}

// ----- Supabase upserts (no helpers, shared supabase client) -----
async function upsertConsumer(shopsId: number, payload: OfferPayload, customerGID: string) {
  const res = await supabase
    .from("consumers")
    .upsert(
      {
        shop: shopsId,
        email: payload.consumerEmail,
        name: payload.consumerName,
        mobile: payload.consumerMobile ?? null,
        postalCode: payload.consumerPostalCode ?? null,
        customerGID,
        lastOfferAt: payload.offerCreateDate,
        modifiedDate: new Date().toISOString(),
      },
      { onConflict: "shop,email" }
    )
    .select("*")
    .single();
  if (res.error || !res.data) throw new Error(res.error?.message || "consumer_upsert_failed");
  return res.data;
}

async function upsertCart(shopsId: number, payload: OfferPayload, consumerId: number | null) {
  const res = await supabase
    .from("carts")
    .upsert(
      {
        shop: shopsId,
        token: payload.cartToken,
        currency: payload.currency,
        items: payload.cartItems,
        units: payload.cartUnits,
        totalPrice: Number(payload.cartTotalPrice),
        createDate: payload.cartCreateDate,
        updateDate: payload.cartUpdateDate,
        consumer: consumerId ?? null,
        payload: payload as unknown as Json,
      },
      { onConflict: "token" }
    )
    .select("*")
    .single();
  if (res.error || !res.data) throw new Error(res.error?.message || "cart_upsert_failed");
  return res.data;
}

async function upsertCartItems(cart: any, payload: OfferPayload) {
  if (!payload.items?.length) return;
  const rows = payload.items.map((it) => ({
    cart: cart.id,
    shop: cart.shop,
    productId: it.productID,
    variantId: it.variantID,
    sku: it.sku ?? null,
    name: it.productName,
    productURL: it.productURL,
    quantity: it.quantity,
    price: it.price,
    lineTotal: it.lineTotal,
    template: it.template ?? null,
  }));
  const res = await supabase.from("cartitems").upsert(rows as any[], { onConflict: "cart,variantId" });
  if (res.error) throw new Error(res.error.message || "cartitems_upsert_failed");
}

async function upsertOffer(shopsId: number, payload: OfferPayload, cart: any, consumer: any) {
  const res = await supabase
    .from("offers")
    .upsert(
      {
        shop: shopsId,
        cart: cart.id,
        consumer: consumer.id,
        cartToken: payload.cartToken,
        currency: payload.currency,
        offerPrice: Number(payload.offerPrice),
        cartTotalPrice: Number(payload.cartTotalPrice),
        status: "Pending",
        createDate: payload.offerCreateDate,
        tosChecked: payload.tosChecked,
        tosCheckedDate: payload.tosCheckedDate,
        payload: payload as unknown as Json,
      },
      { onConflict: "shop,cart" }
    )
    .select("*")
    .single();
  if (res.error || !res.data) throw new Error(res.error?.message || "offer_upsert_failed");
  return res.data;
}

async function markOfferDecision(offerId: number, decision: "Accepted" | "Declined", reason?: string) {
  const res = await supabase
    .from("offers")
    .update({ status: decision, decisionReason: reason ?? null })
    .eq("id", offerId);
  if (res.error) throw new Error(res.error.message || "offer_update_failed");
}

async function upsertDiscount(shopsId: number, offer: any, code: string, amountCents: number, shopifyGID: string) {
  const res = await supabase
    .from("discounts")
    .upsert(
      {
        shop: shopsId,
        offer: offer.id,
        code,
        amount: amountCents / 100,
        currency: offer.currency,
        shopifyGID,
        status: "Active",
        createdAt: new Date().toISOString(),
      },
      { onConflict: "shop,offer" }
    )
    .select("*")
    .single();
  if (res.error || !res.data) throw new Error(res.error?.message || "discount_upsert_failed");
  return res.data;
}

// ----- very basic decision stub (replace with your program rules) -----
async function evaluateOffer(shopsId: number, offer: any, _cart: any): Promise<{ decision: "Accepted" | "Declined"; reason?: string; discountCents?: number }> {
  // Example: fetch most recent ACTIVE program and use a simple threshold
  const res = await supabase
    .from("programs")
    .select("*")
    .eq("shop", shopsId)
    .eq("status", "Active")
    .order("startDate", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message || "program_lookup_failed");

  const threshold = 0.95; // TODO: drive from program row
  const accepted = Number(offer.offerPrice) >= threshold * Number(offer.cartTotalPrice);

  if (!accepted) return { decision: "Declined", reason: `Offer below ${(threshold * 100).toFixed(0)}% threshold` };

  const discountCents = Math.max(0, toCents(Number(offer.cartTotalPrice) - Number(offer.offerPrice)));
  return { decision: "Accepted", discountCents };
}

// ----- request handler -----
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  try {
    if (PUBLIC_API_KEY) {
      const key = req.headers.get("x-iwt-key") || "";
      if (key !== PUBLIC_API_KEY) return json(401, { error: "unauthorized" });
    }

    if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

    const payload = (await req.json()) as OfferPayload;

    // minimal validation
    if (!payload?.storeUrl || !payload?.consumerEmail || !payload?.cartToken) {
      return json(400, { error: "invalid_payload" });
    }

    // 1) shopify auth for this store
    const { shopsId, shopDomain, accessToken } = await getShopifyAuthByDomain(payload.storeUrl);

    // 2) ensure customer exists (Shopify)
    const { customerGID } = await getOrCreateShopifyCustomer({ shopDomain, accessToken }, payload);

    // 3) upserts in Supabase
    const consumer = await upsertConsumer(shopsId, payload, customerGID);
    const cart = await upsertCart(shopsId, payload, consumer.id);
    await upsertCartItems(cart, payload);
    const offer = await upsertOffer(shopsId, payload, cart, consumer);

    // 4) decision
    const { decision, reason, discountCents } = await evaluateOffer(shopsId, offer, cart);
    await markOfferDecision(offer.id, decision, reason);

    if (decision === "Declined" || !discountCents || discountCents <= 0) {
      const result: ProcessOfferResult = {
        decision,
        reason,
        customerGID,
        offerId: offer.id,
        cartId: cart.id,
      };
      return json(200, result);
    }

    // 5) create discount in Shopify
    const code = `IWT-${offer.id}`;
    const { discountGID } = await createShopifyDiscount({ shopDomain, accessToken }, {
      title: `IWT Offer ${offer.id}
