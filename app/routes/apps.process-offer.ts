// app/routes/apps/procee.offer.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import createClient from "../../supabase/server";
import { assertShopifyProxy } from "../utils/verifyShopifyProxy";
import { getShopDataFromProxy } from "../utils/getShopData.server";


// ---------- Small utils ----------
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";
const toDisplayStatus = (s?: string | null) =>
  /auto.?accepted/i.test(s ?? "") ? "Auto Accepted" :
  /auto.?declin/i.test(s ?? "") ? "Auto Declined" :
  /pending/i.test(s ?? "") ? "Pending Review" : "Error";

function assertNum(n: unknown, msg: string): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  throw new Response(msg, { status: 500 });
}

// ---------- Minimal Shopify GraphQL helper ----------
export async function shopifyGraphQL<
  T extends Record<string, unknown> = Record<string, unknown>
>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: any
): Promise<T & { __httpStatus: number }> {
  const resp = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables })
  });
  const body = (await resp.json().catch(() => ({}))) as T;
  return Object.assign(body, { __httpStatus: resp.status });
}

// ---------- Customer search/update/create ----------
const CUSTOMER_SEARCH_Q = `
  query CustomerSearch($q: String!) {
    customers(first: 10, query: $q) {
      edges { node { id email phone firstName lastName displayName } }
    }
  }`;
const CUSTOMER_UPDATE_MUT = `
  mutation CustomerUpdate($id: ID!, $input: CustomerInput!) {
    customerUpdate(id: $id, input: $input) {
      customer { id email phone firstName lastName displayName }
      userErrors { field message }
    }
  }`;
const CUSTOMER_CREATE_MUT = `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id email phone firstName lastName displayName }
      userErrors { field message }
    }
  }`;

function buildCustomerQuery(email?: string | null, phone?: string | null): string | null {
  const parts: string[] = [];
  if (email) parts.push(`email:${JSON.stringify(email)}`);
  if (phone) parts.push(`phone:${JSON.stringify(phone)}`);
  return parts.length ? parts.join(" OR ") : null;
}
function pickBestCustomer(nodes: any[], email?: string | null, phone?: string | null) {
  if (!Array.isArray(nodes) || !nodes.length) return null;
  if (email) {
    const e = nodes.find((n: any) => (n.email ?? "").toLowerCase() === email.toLowerCase());
    if (e) return e;
  }
  if (phone) {
    const p = nodes.find((n: any) => (n.phone ?? "") === phone);
    if (p) return p;
  }
  return nodes[0];
}

async function ensureShopifyCustomer(opts: {
  shopDomain: string; accessToken: string;
  email?: string | null; phone?: string | null;
  firstName?: string | null; lastName?: string | null;
}) : Promise<{ customerGID: string | null; email: string | null }> {
  const { shopDomain, accessToken, email, phone, firstName, lastName } = opts;
  const q = buildCustomerQuery(email, phone);
  let existing: any | null = null;

  if (q) {
    const res: any = await shopifyGraphQL(shopDomain, accessToken, CUSTOMER_SEARCH_Q, { q });
    const nodes = res?.data?.customers?.edges?.map((e: any) => e.node) ?? [];
    existing = pickBestCustomer(nodes, email, phone);
  }

  if (existing?.id) {
    const needUpdate =
      (email && email !== existing.email) ||
      (phone && phone !== existing.phone) ||
      (firstName && firstName !== existing.firstName) ||
      (lastName && lastName !== existing.lastName);

    if (needUpdate) {
      const upd: any = {
        email: email ?? existing.email ?? null,
        phone: phone ?? existing.phone ?? null,
        firstName: firstName ?? existing.firstName ?? null,
        lastName: lastName ?? existing.lastName ?? null
      };
      await shopifyGraphQL(shopDomain, accessToken, CUSTOMER_UPDATE_MUT, { id: existing.id, input: upd });
    }
    return { customerGID: existing.id, email: existing.email ?? email ?? null };
  }

  // create (need at least one of email/phone)
  if (!email && !phone) return { customerGID: null, email: null };
  const cres: any = await shopifyGraphQL(shopDomain, accessToken, CUSTOMER_CREATE_MUT, {
    input: { email: email ?? null, phone: phone ?? null, firstName: firstName ?? null, lastName: lastName ?? null }
  });
  const cust = cres?.data?.customerCreate?.customer;
  return { customerGID: cust?.id ?? null, email: cust?.email ?? email ?? null };
}

// ---------- Discount mutation ----------
const DISCOUNT_MUTATION = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
      codeDiscount {
        ... on DiscountCodeBasic {
          title
          appliesOncePerCustomer
          asyncUsageCount
          codes(first: 1) { edges { node { code } } }
          combinesWith { productDiscounts orderDiscounts shippingDiscounts }
          createdAt
          endsAt
          startsAt
          usageLimit
        }
      }
    }
    userErrors { field message }
  }
}`;

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  assertShopifyProxy(url, process.env.SHOPIFY_API_SECRET!);

  const { shopsID, shopDomain, accessToken, shopsBrandName } = await getShopDataFromProxy(url);


  const payload = await request.json();
  const supabase = createClient();

  // 1) shop + token
  const { data: shop } = await supabase
    .from("shops")
    .select("id, shopDomain")
    .eq("shopDomain", payload.storeUrl)
    .maybeSingle();

  if (!shop?.id || !shop?.shopDomain) {
    return json({ ok: false, error: "Shop not found for storeUrl" }, { status: 404 });
  }

  const { data: auth } = await supabase
    .from("shopauth")
    .select("accessToken")
    .eq("shops", shopsID)
    .maybeSingle();

  if (!auth?.accessToken) {
    return json({ ok: false, error: "Access token missing" }, { status: 500 });
  }

  // 2) Shopify customer preflight (optional but recommended)
  let customerGID: string | null = null;
  let canonicalEmail: string | null = payload.consumerEmail ?? null;
  if (payload.consumerEmail || payload.consumerMobile) {
    const ensured = await ensureShopifyCustomer({
      shopDomain: shop.shopDomain,
      accessToken: auth.accessToken,
      email: payload.consumerEmail,
      phone: payload.consumerMobile,
      firstName: payload.consumerFirstName,
      lastName: payload.consumerLastName
    });
    customerGID = ensured.customerGID;
    canonicalEmail = ensured.email ?? payload.consumerEmail ?? null;
  }

  // 3) consumers (+ consumerShops) via RPC
  const { data: consRes, error: consErr } = await supabase.rpc("process_offer_upsert_consumers", {
    payload: {
      storeUrl: payload.storeUrl,
      displayName: payload.consumerName ?? null,
      email: canonicalEmail ?? null,
      phone: payload.consumerMobile ?? null,
      postalCode: payload.consumerPostalCode ?? null
    }
  });
  if (consErr) return json({ ok: false, step: "consumers", error: consErr.message }, { status: 500 });

  const consumersID = assertNum(consRes?.[0]?.consumersID, "Missing consumersID");
  const shopsIDfromRPC = assertNum(consRes?.[0]?.shopsID, "Missing shopsID");
  // sanity: both should match
  if (shopsID !== shopsIDfromRPC) {
    return json({ ok: false, error: "shopsID mismatch" }, { status: 500 });
  }

  // 4) carts
  const { data: cartRes, error: cartErr } = await supabase.rpc(
    "process_offer_upsert_carts",
    // Some generated TS expect cartsID param; cast to any so we don't send it.
    { payload, consumersID, shopsID } as any
  );
  if (cartErr) return json({ ok: false, step: "carts", error: cartErr.message }, { status: 500 });
  const cartsID = assertNum(cartRes?.[0]?.cartsID, "Missing cartsID");

  // 5) cartitems
  const { error: itemsErr } = await supabase.rpc(
    "process_offer_upsert_cartitems",
    { payload, cartsID, consumersID, shopsID } as any
  );
  if (itemsErr) return json({ ok: false, step: "cartitems", error: itemsErr.message }, { status: 500 });

  // 6) offers
  const { data: offerRes, error: offerErr } = await supabase.rpc(
    "process_offer_upsert_offers",
    { payload: { ...payload, customerGID, consumerEmail: canonicalEmail }, cartsID, consumersID, shopsID } as any
  );
  if (offerErr) return json({ ok: false, step: "offers", error: offerErr.message }, { status: 500 });
  const offersID = assertNum(offerRes?.[0]?.offersID, "Missing offersID");

  // 7) evaluate
  const { data: evalRes, error: evalErr } = await supabase.rpc("process_offer_evaluate_offers", { offersid: offersID });
  if (evalErr) return json({ ok: false, step: "evaluate", error: evalErr.message }, { status: 500 });

  const displayStatus = toDisplayStatus(evalRes?.[0]?.status);

  if (displayStatus !== "Auto Accepted") {
    // fetch minimal fields for UI
    const { data: o } = await supabase
      .from("offers")
      .select("offerPrice, discountCode")
      .eq("id", offersID)
      .maybeSingle();

    return json({
      ok: true,
      offerStatus: displayStatus,
      offerAmount: o?.offerPrice ?? null,
      discountCode: o?.discountCode ?? null,
      expiryMinutes: null,
      checkoutUrl: null,
      firstName: payload?.consumerFirstName ?? null,
      cartPrice: payload?.cartTotal ?? null
    });
  }

  // 8) discounts row in Supabase
  const { data: dRes, error: dErr } = await supabase.rpc("process_offer_upsert_discounts", { offersid: offersID });
  if (dErr) return json({ ok: false, step: "discounts-upsert", error: dErr.message }, { status: 500 });
  const discountsID = assertNum(dRes?.[0]?.discountsID, "Missing discountsID");

  // 9) variables for Shopify
  const { data: varsRes, error: varsErr } = await supabase.rpc("process_offer_shopify_discount", { discountsID });
  if (varsErr) return json({ ok: false, step: "build-variables", error: varsErr.message }, { status: 500 });

  // 10) post to Shopify
  const sBody: any = await shopifyGraphQL(shop.shopDomain, auth.accessToken, DISCOUNT_MUTATION, varsRes);

  // 11) record response
  const { error: recordErr } = await supabase.rpc("process_offer_shopify_response", { discountsID, response: sBody });
  if (recordErr) {
    return json({ ok: false, step: "record-response", error: recordErr.message, shopify: sBody }, { status: 500 });
  }

  // 12) final pull for UI (avoid non-existent columns)
  const { data: finalOffer } = await supabase
    .from("offers")
    .select("offerPrice, approvedDiscountPrice, discountCode, offerExpiryMinutes")
    .eq("id", offersID)
    .maybeSingle();

  const discountCode =
    sBody?.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes?.edges?.[0]?.node?.code
    ?? finalOffer?.discountCode ?? null;

  const checkoutUrl = discountCode
    ? `https://${shop.shopDomain}/cart?discount=${encodeURIComponent(discountCode)}`
    : null;

  return json({
    ok: true,
    offerStatus: "Auto Accepted",
    offerAmount: finalOffer?.offerPrice ?? null,
    discountCode,
    expiryMinutes: finalOffer?.offerExpiryMinutes ?? null,
    checkoutUrl,
    firstName: payload?.consumerFirstName ?? null,
    cartPrice: payload?.cartTotal ?? null
  });
};

export const loader = () => new Response("Method Not Allowed", { status: 405 });
