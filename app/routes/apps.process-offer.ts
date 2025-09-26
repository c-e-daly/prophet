// app/routes/apps/process.offer.ts

// app/routes/apps.process-offer.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createServerClient } from "../../supabase/server";
import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../utils/getShopData.server";
import type { Json } from "../../supabase/database.types";
import { parseFirstName, parseLastName, formatUSD } from "../utils/format"



// ---------- Small utils ----------


const API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";

const toDisplayStatus = (s?: string | null): string =>
  /auto.?accepted/i.test(s ?? "") ? "Auto Accepted" :
  /auto.?declin/i.test(s ?? "") ? "Auto Declined" :
  /pending/i.test(s ?? "") ? "Pending Review" : "Error";

function assertNum(n: unknown, msg: string): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  throw new Response(msg, { status: 500 });
}

// Helper to safely treat RPC data as rows
function asRows<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

// ---------- Shopify GraphQL helper ----------
async function shopifyGraphQL<T extends Record<string, unknown> = Record<string, unknown>>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: unknown
): Promise<T & { __httpStatus: number }> {
  const resp = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  let body: unknown;
  try { body = await resp.json(); } catch { body = {}; }

  return { ...(body as Record<string, unknown>), __httpStatus: resp.status } as T & { __httpStatus: number };
}

// ---------- Shopify Response Types ----------
interface ShopifyCustomer {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  tags?: string,
  [key: string]: unknown;
}
interface ShopifyUserError { field: string[]; message: string; [key: string]: unknown; }

interface ShopifyCustomerCreateResponse extends Record<string, unknown> {
  data: { customerCreate: { customer: ShopifyCustomer | null; userErrors: ShopifyUserError[] } };
}
interface ShopifyCustomerSearchResponse extends Record<string, unknown> {
  data: { customers: { edges: Array<{ node: ShopifyCustomer }> } };
}
interface ShopifyDiscountResponse extends Record<string, unknown> {
  data: {
    discountCodeBasicCreate: {
      codeDiscountNode: {
        id: string;
        codeDiscount: { codes: { edges: Array<{ node: { code: string } }> } };
      } | null;
      userErrors: ShopifyUserError[];
    };
  };
}

// ---------- Simple Customer Create ----------
const CUSTOMER_CREATE_MUT = `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id email phone firstName lastName displayName tags}
      userErrors { field message }
    }
  }
`;
const CUSTOMER_SEARCH_Q = `
  query CustomerSearch($q: String!) {
    customers(first: 1, query: $q) { edges { node { id email } } }
  }
`;

interface CustomerResult { customerGID: string | null; email: string | null; }
interface CustomerInput {
  shopDomain: string; accessToken: string;
  email?: string | null; phone?: string | null;
  firstName?: string | null; lastName?: string | null; displayName?: string | null;
  tags?: string[] | string | null;
}

async function createShopifyCustomer(opts: CustomerInput): Promise<CustomerResult> {
  const { shopDomain, accessToken, email, phone, firstName, lastName } = opts;
  if (!email && !phone) return { customerGID: null, email: null };

  try {
    const response = await shopifyGraphQL<ShopifyCustomerCreateResponse>(
      shopDomain, accessToken, CUSTOMER_CREATE_MUT,
      { input: { email: email ?? null, phone: phone ?? null, firstName: firstName ?? null, lastName: lastName ?? null } }
    );

    const customer = response?.data?.customerCreate?.customer;
    const userErrors = response?.data?.customerCreate?.userErrors ?? [];

    if (customer?.id) {
      return { customerGID: customer.id, email: customer.email ?? email ?? null };
    }

    const emailTaken = userErrors.find((e) => e.field?.includes("email") && e.message?.toLowerCase().includes("taken"));
    if (emailTaken && email) {
      const search = await shopifyGraphQL<ShopifyCustomerSearchResponse>(
        shopDomain, accessToken, CUSTOMER_SEARCH_Q, { q: `email:"${email}"` }
      );
      const existing = search?.data?.customers?.edges?.[0]?.node;
      if (existing?.id) return { customerGID: existing.id, email: existing.email ?? email ?? null };
    }

    console.error("Customer creation failed:", { userErrors, response });
    return { customerGID: null, email: null };
  } catch (err) {
    console.error("Shopify customer creation error:", err);
    return { customerGID: null, email: null };
  }
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
  }
`;

// ---------- Typed-ish RPC result shapes ----------
type RpcUpsertConsumers = { consumersID: number; shopsID: number; customerShopifyGID: string | null };
type RpcUpsertCarts = { cartsID: number };
type RpcUpsertOffers = { offersID: number; programsID: number; campaignsID: number; periodsID: number };
type RpcEvaluateOffers = { offersID: number; programsID: number; consumersID: number; cartsID: number; shopsID: number; status: string };
type RpcUpsertDiscounts = { discountsID: number; code: string };

// ---------- Main Action ----------
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session?.shop) return json({ error: "Shop not found" }, { status: 401 });

  const { shopsRow, accessToken } = await getShopByDomain(session.shop);
  if (session.accessToken !== accessToken) return json({ error: "Access tokens out of sync" }, { status: 401 });

  const shopsID = shopsRow.id;
  const shopDomain = shopsRow.shopDomain || session.shop;
  if (!shopDomain) return json({ error: "Shop domain not found" }, { status: 500 });

  const payload = await request.json();
  const supabase = createServerClient(); // no generics here

  // 1) Customer create/find
  let customerGID: string | null = null;
  let canonicalEmail: string | null = payload.consumerEmail ?? null;

  if (payload.consumerEmail || payload.consumerMobile) {
    const customerResult = await createShopifyCustomer({
      shopDomain,
      accessToken,
      email: payload.consumerEmail,
      phone: payload.consumerMobile,
      firstName: parseFirstName(payload.consumerName),
      lastName: parseLastName(payload.consumerName),
      displayName: payload.consumerName,
      tags: ["Source: I Want That! Customer Generated Offer"]
    });
    customerGID = customerResult.customerGID;
    canonicalEmail = customerResult.email ?? payload.consumerEmail ?? null;
  }

  // 2) Consumers
  const { data: consData, error: consErr } = await supabase.rpc(
    "process_offer_upsert_consumers",
    {
      payload: {
        storeUrl: shopsRow.shopDomain,
        consumerName: payload.consumerName ?? null,
        email: canonicalEmail ?? null,
        phone: payload.consumerMobile ?? null,
        postalCode: payload.consumerPostalCode ?? null,
        customerShopifyGID: customerGID,
      },
    }
  );

  if (consErr) {
  console.error('RPC ERROR - process_offer_upsert_consumers:', {
    code: consErr.code ?? 'unknown',       
    details: consErr.details ?? 'no details', 
    hint: consErr.hint ?? 'no hint',       
    message: consErr.message ?? 'no message'
  });
  return json({ ok: false, step: "consumers", error: consErr.message ?? 'Unknown error' }, { status: 500 });
}


  const consRow = asRows<RpcUpsertConsumers>(consData)[0];
  const consumersID = assertNum(consRow?.consumersID, "Missing consumersID");
  const shopsIDfromRPC = assertNum(consRow?.shopsID, "Missing shopsID");
  if (shopsID !== shopsIDfromRPC) return json({ ok: false, error: "shopsID mismatch" }, { status: 500 });

  // 3) Carts
  const { data: cartData, error: cartErr } = await supabase.rpc(
    "process_offer_upsert_carts",
    { payload, consumersID, shopsID }
  );
  if (cartErr) {
  console.error('RPC ERROR - process_offer_upsert_carts:', {
    code: cartErr.code ?? 'unknown',       
    details: cartErr.details ?? 'no details', 
    hint: cartErr.hint ?? 'no hint',       
    message: cartErr.message ?? 'no message'
  });
  return json({ ok: false, step: "carts", error: cartErr.message ?? 'Unknown error' }, { status: 500 });
}

  const cartRow = asRows<RpcUpsertCarts>(cartData)[0];
  const cartsID = assertNum(cartRow?.cartsID, "Missing cartsID");

  // 4) Cart items
  const { error: itemsErr } = await supabase.rpc(
    "process_offer_upsert_cartitems",
    { payload, cartsID, consumersID, shopsID }
  );
  
  if (itemsErr) {
  console.error('RPC ERROR - process_offer_upsert_items:', {
    code: itemsErr.code ?? 'unknown',       
    details: itemsErr.details ?? 'no details', 
    hint: itemsErr.hint ?? 'no hint',       
    message: itemsErr.message ?? 'no message'
  });
  return json({ ok: false, step: "items", error: itemsErr.message ?? 'Unknown error' }, { status: 500 });
}
  
  // 5) Offers
  const { data: offerData, error: offerErr } = await supabase.rpc(
    "process_offer_upsert_offers",
    {
      payload: { ...payload, customerGID, consumerEmail: canonicalEmail },
      cartsID,
      consumersID,
      shopsID,
    }
  );
  if (offerErr) {
  console.error('RPC ERROR - process_offer_upsert_offers:', {
    code: offerErr.code ?? 'unknown',       
    details: offerErr.details ?? 'no details', 
    hint: offerErr.hint ?? 'no hint',       
    message: offerErr.message ?? 'no message'
  });
  return json({ ok: false, step: "offers", error: offerErr.message ?? 'Unknown error' }, { status: 500 });
}

  const offerRow = asRows<RpcUpsertOffers>(offerData)[0];
  const offersID = assertNum(offerRow?.offersID, "Missing offersID");

  // 6) Evaluate
  const { data: evalData, error: evalErr } = await supabase.rpc(
    "process_offer_evaluate_offers",
    { offersid: offersID }
  );
  if (evalErr) {
  console.error('RPC ERROR - process_offer_evaluate_offers:', {
    code: evalErr.code ?? 'unknown',       
    details: evalErr.details ?? 'no details', 
    hint: evalErr.hint ?? 'no hint',       
    message: evalErr.message ?? 'no message'
  });
  return json({ ok: false, step: "evaluate", error: evalErr.message ?? 'Unknown error' }, { status: 500 });
}

  const evalRow = asRows<RpcEvaluateOffers>(evalData)[0];
  const displayStatus = toDisplayStatus(evalRow?.status);

  // If not auto-accepted, return early
  if (displayStatus !== "Auto Accepted") {
    const { data: offer } = await supabase
      .from("offers")
      .select("offerPrice, discountCode")
      .eq("id", offersID)
      .maybeSingle();

    return json({
      ok: true,
      offerStatus: displayStatus,
      offerAmount: offer?.offerPrice ?? null,
      discountCode: offer?.discountCode ?? null,
      expiryMinutes: null,
      checkoutUrl: null,
      firstName: payload?.consumerFirstName ?? null,
      cartPrice: payload?.cartTotal ?? null,
    });
  }

  // 7) Discounts upsert
  const { data: discData, error: discountErr } = await supabase.rpc(
    "process_offer_upsert_discounts",
    { offersid: offersID }
  );
  if (discountErr) {
  console.error('RPC ERROR - process_offer_upsert_discounts:', {
    code: discountErr.code ?? 'unknown',       
    details: discountErr.details ?? 'no details', 
    hint: discountErr.hint ?? 'no hint',       
    message: discountErr.message ?? 'no message'
  });
  return json({ ok: false, step: "discounts-upsert", error: discountErr.message ?? 'Unknown error' }, { status: 500 });
}

  const discRow = asRows<RpcUpsertDiscounts>(discData)[0];
  const discountsID = assertNum(discRow?.discountsID, "Missing discountsID");

  // 8) Build Shopify discount variables
  const { data: varsRes, error: varsErr } = await supabase.rpc(
    "process_offer_shopify_discount",
    { discountsID: discountsID } as any
  );
  if (varsErr) {
  console.error('RPC ERROR - process_offer_shopify_discount:', {
    code: varsErr.code ?? 'unknown',       
    details: varsErr.details ?? 'no details', 
    hint: varsErr.hint ?? 'no hint',       
    message: varsErr.message ?? 'no message'
  });
  return json({ ok: false, step: "build-variables", error: varsErr.message ?? 'Unknown error' }, { status: 500 });
}
  
  
  // 9) Create discount in Shopify
  const shopifyResponse = await shopifyGraphQL<ShopifyDiscountResponse>(
    shopDomain, accessToken, DISCOUNT_MUTATION, varsRes
  );

  // 10) Record Shopify response
  const responseJson = JSON.parse(JSON.stringify(shopifyResponse)) as Json;
  const { error: recordErr } = await supabase.rpc(
    "process_offer_shopify_response",
    { discountsID, response: responseJson, }
  );
  if (recordErr) {
  console.error('RPC ERROR - process_offer_shopify_response:', {
    code: recordErr.code ?? 'unknown',       
    details: recordErr.details ?? 'no details', 
    hint: recordErr.hint ?? 'no hint',       
    message: recordErr.message ?? 'no message'
  });
  return json({ ok: false, step: "record-response", error: recordErr.message ?? 'Unknown error' }, { status: 500 });
}
  
  
  // 11) Final offer data
  const { data: finalOffer } = await supabase
    .from("offers")
    .select("offerPrice, approvedDiscountPrice, discountCode, offerExpiryMinutes, cartToken, cartTotalPrice, consumerName")
    .eq("id", offersID)
    .maybeSingle();

  const discountCode =
    shopifyResponse?.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes?.edges?.[0]?.node?.code
    ?? finalOffer?.discountCode
    ?? null;

  const cartToken = finalOffer?.cartToken;
  const checkoutUrl = discountCode ? `https://${shopDomain}/checkouts/cn/${cartToken}?discount=${discountCode}` : null;
  const firstName = parseFirstName(finalOffer?.consumerName);

  return json({
    ok: true,
    offerStatus: "Auto Accepted",
    offerAmount: formatUSD(finalOffer?.offerPrice) ?? null,
    discountCode,
    expiryMinutes: finalOffer?.offerExpiryMinutes ?? null,
    checkoutUrl,
    firstName,
    cartPrice: formatUSD(finalOffer?.cartTotalPrice) ?? null,
  });
};

export const loader = () => new Response("Method Not Allowed", { status: 405 });



/*
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createServerClient } from "../../supabase/server";
import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../utils/getShopData.server"; 

// ---------- Small utils ----------
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";

const toDisplayStatus = (s?: string | null): string =>
  /auto.?accepted/i.test(s ?? "") ? "Auto Accepted" :
  /auto.?declin/i.test(s ?? "") ? "Auto Declined" :
  /pending/i.test(s ?? "") ? "Pending Review" : "Error";

function assertNum(n: unknown, msg: string): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  throw new Response(msg, { status: 500 });
}

// ---------- Shopify GraphQL helper ----------
async function shopifyGraphQL<T extends Record<string, unknown> = Record<string, unknown>>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: unknown
): Promise<T & { __httpStatus: number }> {
  const resp = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-Shopify-Access-Token": accessToken 
    },
    body: JSON.stringify({ query, variables })
  });

  let body: unknown;
  try { 
    body = await resp.json(); 
  } catch { 
    body = {}; 
  }

  return {
    ...(body as Record<string, unknown>),
    __httpStatus: resp.status,
  } as T & { __httpStatus: number };
}

// ---------- Shopify Response Types ----------
interface ShopifyCustomer {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  [key: string]: unknown; // Index signature for Record<string, unknown> constraint
}

interface ShopifyUserError {
  field: string[];
  message: string;
  [key: string]: unknown; // Index signature
}

interface ShopifyCustomerCreateResponse extends Record<string, unknown> {
  data: {
    customerCreate: {
      customer: ShopifyCustomer | null;
      userErrors: ShopifyUserError[];
    };
  };
}

interface ShopifyCustomerSearchResponse extends Record<string, unknown> {
  data: {
    customers: {
      edges: Array<{
        node: ShopifyCustomer;
      }>;
    };
  };
}

interface ShopifyDiscountResponse extends Record<string, unknown> {
  data: {
    discountCodeBasicCreate: {
      codeDiscountNode: {
        id: string;
        codeDiscount: {
          codes: {
            edges: Array<{
              node: {
                code: string;
              };
            }>;
          };
        };
      } | null;
      userErrors: ShopifyUserError[];
    };
  };
}

// ---------- Simple Customer Create ----------
const CUSTOMER_CREATE_MUT = `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { 
        id 
        email 
        phone 
        firstName 
        lastName 
        displayName 
      }
      userErrors { 
        field 
        message 
      }
    }
  }
`;

const CUSTOMER_SEARCH_Q = `
  query CustomerSearch($q: String!) {
    customers(first: 1, query: $q) {
      edges { 
        node { 
          id 
          email 
        } 
      }
    }
  }
`;

interface CustomerResult {
  customerGID: string | null;
  email: string | null;
}

interface CustomerInput {
  shopDomain: string; 
  accessToken: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null; 
  lastName?: string | null;
}

async function createShopifyCustomer(opts: CustomerInput): Promise<CustomerResult> {
  const { shopDomain, accessToken, email, phone, firstName, lastName } = opts;
  
  if (!email && !phone) {
    return { customerGID: null, email: null };
  }

  try {
    // Always try to create the customer first
    const response = await shopifyGraphQL<ShopifyCustomerCreateResponse>(
      shopDomain, 
      accessToken, 
      CUSTOMER_CREATE_MUT, 
      {
        input: {
          email: email || null,
          phone: phone || null,
          firstName: firstName || null,
          lastName: lastName || null
        }
      }
    );

    const customer = response?.data?.customerCreate?.customer;
    const userErrors = response?.data?.customerCreate?.userErrors || [];
    
    // If customer was created successfully
    if (customer?.id) {
      return { 
        customerGID: customer.id, 
        email: customer.email ?? email ?? null
      };
    }
    
    // Check for "Email has already been taken" error
    const emailTakenError = userErrors.find((err: ShopifyUserError) => 
      err.field?.includes('email') && 
      err.message?.toLowerCase().includes('taken')
    );
    
    if (emailTakenError && email) {
      // Customer exists with this email - get their customerGID
      const searchQuery = `email:"${email}"`;
      const searchResponse = await shopifyGraphQL<ShopifyCustomerSearchResponse>(
        shopDomain, 
        accessToken, 
        CUSTOMER_SEARCH_Q, 
        { q: searchQuery }
      );
      
      const existingCustomer = searchResponse?.data?.customers?.edges?.[0]?.node;
      if (existingCustomer?.id) {
        return { 
          customerGID: existingCustomer.id, 
          email: existingCustomer.email ?? email ?? null
        };
      }
    }
    
    // If we get here, something went wrong
    console.error('Customer creation failed:', { userErrors, response });
    return { customerGID: null, email: null };
    
  } catch (error) {
    console.error('Shopify customer creation error:', error);
    return { customerGID: null, email: null };
  }
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
            codes(first: 1) { 
              edges { 
                node { 
                  code 
                } 
              } 
            }
            combinesWith { 
              productDiscounts 
              orderDiscounts 
              shippingDiscounts 
            }
            createdAt
            endsAt
            startsAt
            usageLimit
          }
        }
      }
      userErrors { 
        field 
        message 
      }
    }
  }
`;

// ---------- Main Action ----------
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
    
  if (!session?.shop) {
    return json({ error: "Shop not found" }, { status: 401 });
  }
             
  const { shopsRow, accessToken } = await getShopByDomain(session.shop);

  if (session.accessToken !== accessToken) {
    return json({ error: "Access tokens out of sync" }, { status: 401 });
  }
  
  const shopsID = shopsRow.id;
  const shopDomain = shopsRow.shopDomain || session.shop;
 
  if (!shopDomain) {
    return json({ error: "Shop domain not found" }, { status: 500 });
  }

  const payload = await request.json();
  const supabase = createServerClient();

  // 1) Create/find Shopify customer
  let customerGID: string | null = null;
  let canonicalEmail: string | null = payload.consumerEmail ?? null;
  
  if (payload.consumerEmail || payload.consumerMobile) {
    const customerResult = await createShopifyCustomer({
      shopDomain,
      accessToken,
      email: payload.consumerEmail,
      phone: payload.consumerMobile,
      firstName: payload.consumerFirstName,
      lastName: payload.consumerLastName
    });
    
    customerGID = customerResult.customerGID;
    canonicalEmail = customerResult.email ?? payload.consumerEmail ?? null;
    
    console.log(`[process-offer] Customer result: customerGID=${customerGID}, email=${canonicalEmail}`);
  }

  // 2) Create consumer record
  const { data: consRes, error: consErr } = await supabase.rpc("process_offer_upsert_consumers", {
    payload: {
      storeUrl: shopsRow.shopDomain,
      consumerName: payload.consumerName ?? null,
      email: canonicalEmail ?? null,
      phone: payload.consumerMobile ?? null,
      postalCode: payload.consumerPostalCode ?? null,
      customerShopifyGID: customerGID
    }
  });
  
  if (consErr) {
    return json({ ok: false, step: "consumers", error: consErr.message }, { status: 500 });
  }

  const consumersID = assertNum(consRes?.[0]?.consumersID, "Missing consumersID");
  const shopsIDfromRPC = assertNum(consRes?.[0]?.shopsID, "Missing shopsID");
  
  if (shopsID !== shopsIDfromRPC) {
    return json({ ok: false, error: "shopsID mismatch" }, { status: 500 });
  }

  // 3) Create cart record
  const { data: cartRes, error: cartErr } = await supabase.rpc("process_offer_upsert_carts", {
    payload,
    consumersID,
    shopsID
  });
  
  if (cartErr) {
    return json({ ok: false, step: "carts", error: cartErr.message }, { status: 500 });
  }
  
  const cartsID = assertNum(cartRes?.[0]?.cartsID, "Missing cartsID");

  // 4) Create cart items
  const { error: itemsErr } = await supabase.rpc("process_offer_upsert_cartitems", {
    payload,
    cartsID,
    consumersID,
    shopsID
  });
  
  if (itemsErr) {
    console.error('RPC ERROR', {
    code: itemsErr.code,       
    details: itemsErr.details, 
    hint: itemsErr.hint,       
    message: itemsErr.message  
  });
    return json({ ok: false, step: "cartitems", error: itemsErr.message }, { status: 500 });
  }

  // 5) Create offer
  const { data: offerRes, error: offerErr } = await supabase.rpc("process_offer_upsert_offers", {
    payload: { 
      ...payload, 
      customerGID, 
      consumerEmail: canonicalEmail 
    },
    cartsID,
    consumersID,
    shopsID
  });
  
  if (offerErr) {
      console.error('RPC ERROR', {
  code: offerErr.code,       
  details: offerErr.details, 
  hint: offerErr.hint,       
  message:offerErr.message  
});
    return json({ ok: false, step: "offers", error: offerErr.message }, { status: 500 });
  }
  
  const offersID = assertNum(offerRes?.[0]?.offersID, "Missing offersID");

  // 6) Evaluate offer
  const { data: evalRes, error: evalErr } = await supabase.rpc("process_offer_evaluate_offers", { 
    offersid: offersID 
  });
  
  if (evalErr) {
    return json({ ok: false, step: "evaluate", error: evalErr.message }, { status: 500 });
  }

  const displayStatus = toDisplayStatus(evalRes?.[0]?.status);

  // If not auto-accepted, return early
  if (displayStatus !== "Auto Accepted") {
    const { data: offer } = await supabase
      .from("offers")
      .select("offerPrice, discountCode")
      .eq("id", offersID)
      .maybeSingle();

    return json({
      ok: true,
      offerStatus: displayStatus,
      offerAmount: offer?.offerPrice ?? null,
      discountCode: offer?.discountCode ?? null,
      expiryMinutes: null,
      checkoutUrl: null,
      firstName: payload?.consumerFirstName ?? null,
      cartPrice: payload?.cartTotal ?? null
    });
  }

  // 7) Create discount record in Supabase
  const { data: discountRes, error: discountErr } = await supabase.rpc("process_offer_upsert_discounts", { 
    offersid: offersID 
  });
  
  if (discountErr) {
    return json({ ok: false, step: "discounts-upsert", error: discountErr.message }, { status: 500 });
  }
  
  const discountsID = assertNum(discountRes?.[0]?.discountsID, "Missing discountsID");

  // 8) Get Shopify discount variables
  const { data: varsRes, error: varsErr } = await supabase.rpc("process_offer_shopify_discount", { 
    discountsID 
  });
  
  if (varsErr) {
      console.error('RPC ERROR', {
      code: varsErr.code,       
      details: varsErr.details, 
      hint: varsErr.hint,       
      message: varsErr.message  
    });
    return json({ ok: false, step: "build-variables", error: varsErr.message }, { status: 500 });
  }

  // 9) Create discount in Shopify
  const shopifyResponse = await shopifyGraphQL<ShopifyDiscountResponse>(
    shopDomain, 
    accessToken, 
    DISCOUNT_MUTATION, 
    varsRes
  );

  // 10) Record Shopify response  
  const { error: recordErr } = await supabase.rpc("process_offer_shopify_response", { 
    discountsID, 
    response: shopifyResponse as any // Cast to any for JSON storage
  });
  
  if (recordErr) {
      console.error('RPC ERROR', {
      code: recordErr.code,       
      details: recordErr.details, 
      hint: recordErr.hint,       
      message: recordErr.message  
    });

    return json({ 
      ok: false, 
      step: "record-response", 
      error: recordErr.message, 
      shopify: shopifyResponse 
    }, { status: 500 });
  }

  // 11) Get final offer data for response
  const { data: finalOffer } = await supabase
    .from("offers")
    .select("offerPrice, approvedDiscountPrice, discountCode, offerExpiryMinutes")
    .eq("id", offersID)
    .maybeSingle();

  const discountCode = shopifyResponse?.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes?.edges?.[0]?.node?.code
    ?? finalOffer?.discountCode ?? null;

  const checkoutUrl = discountCode
    ? `https://${shopDomain}/cart?discount=${encodeURIComponent(discountCode)}`
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

*/