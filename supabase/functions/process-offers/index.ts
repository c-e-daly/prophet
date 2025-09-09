
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// ---- ENV ----
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SHOPIFY_API_VERSION = Deno.env.get("SHOPIFY_API_VERSION") ?? "2024-10";

// ---- helpers ----
const json = (body: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json; charset=utf-8", ...init.headers },
  });

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

// Incoming payload (theme app)
type OfferPayload = {
  storeUrl: string;
  consumerName?: string;
  consumerEmail?: string;
  consumerMobile?: string;
  consumerPostalCode?: string;
  currency?: string;
  offerPrice?: string;
  tosChecked?: boolean;
  tosCheckedDate?: string;
  cartToken: string;
  cartCreateDate?: string;
  cartUpdateDate?: string;
  offerCreateDate?: string;
  cartComposition?: string;
  items?: Array<{
    productID?: number;
    productName?: string;
    productURL?: string;
    variantID?: number;
    variantSKU?: string;      // prefer variantSKU in DB
    variantQuantity?: number; // prefer variantQuantity in DB
    sellingPrice?: number;
    lineTotal?: number;
    cartToken?: string;
    template?: string;
  }>;
  cartItems?: number;
  cartUnits?: number;
  cartTotalPrice?: string;
};

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  // 0) Parse & validate
  let payload: OfferPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!payload?.storeUrl || !payload?.cartToken) {
    return json({ error: "storeUrl and cartToken are required" }, { status: 400 });
  }

  // 1) Upsert consumer (+ consumerShop), return consumersID + shopsID
  const { data: consRes, error: consErr } = await supabase.rpc(
    "process_offer_upsert_consumers",
    {
      payload: {
        storeUrl: payload.storeUrl,
        displayName: payload.consumerName ?? null,
        email: payload.consumerEmail ?? null,
        phone: payload.consumerMobile ?? null,
        postalCode: payload.consumerPostalCode ?? null,
      },
    },
  );
  if (consErr) return json({ step: "consumers", error: consErr.message }, { status: 500 });

  const { consumersID, shopsID } = (consRes?.[0] ?? {}) as {
    consumersID: number;
    shopsID: number;
  };
  if (!consumersID || !shopsID) {
    return json({ step: "consumers", error: "Missing consumersID or shopsID" }, { status: 500 });
  }

  // 2) Upsert cart, return cartsID
  const { data: cartRes, error: cartErr } = await supabase.rpc(
    "process_offer_upsert_carts",
    { payload, consumersID, shopsID },
  );
  if (cartErr) return json({ step: "carts", error: cartErr.message }, { status: 500 });

  const cartsID = cartRes?.[0]?.cartsID as number | undefined;
  if (!cartsID) return json({ step: "carts", error: "Missing cartsID" }, { status: 500 });

  // 3) Upsert cart items
  const { error: itemsErr } = await supabase.rpc(
    "process_offer_upsert_cartitems",
    { payload, cartsID, consumersID, shopsID },
  );
  if (itemsErr) return json({ step: "cartitems", error: itemsErr.message }, { status: 500 });

  // 4) Upsert offer, return offersID (+ attach to cart/consumer/shop/period/program)
  const { data: offerRes, error: offerErr } = await supabase.rpc(
    "process_offer_upsert_offers",
    { payload, cartsID, consumersID, shopsID },
  );
  if (offerErr) return json({ step: "offers", error: offerErr.message }, { status: 500 });

  const offersID = offerRes?.[0]?.offersID as number | undefined;
  if (!offersID) return json({ step: "offers", error: "Missing offersID" }, { status: 500 });

  // 5) Evaluate offer (no triggers; explicit RPC)
  const { data: evalRes, error: evalErr } = await supabase.rpc(
    "process_offer_evaluate_offers",
    { offersID },
  );
  if (evalErr) return json({ step: "evaluate", error: evalErr.message }, { status: 500 });

  const evaluated = (evalRes?.[0] ?? {}) as {
    offer_id?: number; program_id?: number; consumer_id?: number; cart_id?: number; shop_id?: number; status?: string;
    offersID?: number; programsID?: number; consumersID?: number; cartsID?: number; shopsID?: number; // if your RPC returns camelCase
  };

  // Normalize status + IDs regardless of RPC return casing
  const offerStatus = (evaluated.status ?? null) as string | null;

  if (offerStatus === "PendingReview" || offerStatus === "AutoDecline") {
    // Short-circuit to theme app
    const { data: offerRow } = await supabase
      .from("offers")
      .select("offerPrice, approvedDiscountPrice, discountPercent, discountCode")
      .eq("id", offersID)
      .maybeSingle();

    return json({
      ok: true,
      phase: "evaluated",
      result: {
        offersID, cartsID, consumersID, shopsID,
        status: offerStatus,
        offerPrice: offerRow?.offerPrice ?? null,
        approvedDiscountPrice: offerRow?.approvedDiscountPrice ?? null,
        discountPercent: offerRow?.discountPercent ?? null,
        discountCode: offerRow?.discountCode ?? null,
      },
    });
  }

  // 6) If AutoAccept, create (or upsert) discount row explicitly (no trigger)
  let discountsID: number | null = null;
  {
    const { data: dRes, error: dErr } = await supabase.rpc(
      "process_offer_upsert_discounts",
      { offersID },
    );
    if (dErr) return json({ step: "discounts-upsert", error: dErr.message }, { status: 500 });

    // accept either {discountsID} or {discountsId} or a row with id
    const d0 = dRes?.[0] ?? {};
    discountsID = (d0.discountsID ?? d0.discountsId ?? d0.id ?? null) as number | null;
    if (!discountsID) {
      return json({ step: "discounts-upsert", error: "Missing discountsID from RPC" }, { status: 500 });
    }
  }

  // 7) Build Shopify variables for this discount
  const { data: varsRes, error: varsErr } = await supabase.rpc(
    "process_offer_shopify_discount",
    { discountsID }, // if your SQL expects discountsId, change the key accordingly
  );
  if (varsErr) return json({ step: "build-variables", error: varsErr.message, discountsID }, { status: 500 });

  const variables = varsRes; // already shaped as { basicCodeDiscount: ... }

  // 8) Shop creds
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("shopDomain")
    .eq("id", shopsID)
    .maybeSingle();
  if (shopErr || !shop?.shopDomain) {
    return json({ step: "shop-domain", error: shopErr?.message ?? "shopDomain not found" }, { status: 500 });
  }

  const { data: auth, error: authErr } = await supabase
    .from("shopauth")
    .select("accessToken")
    .eq("shops", shopsID)
    .maybeSingle();
  if (authErr || !auth?.accessToken) {
    return json({ step: "shop-auth", error: authErr?.message ?? "access token not found" }, { status: 500 });
  }

  // 9) Post to Shopify
  const shopifyEndpoint = `https://${shop.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const resp = await fetch(shopifyEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": auth.accessToken,
    },
    body: JSON.stringify({ query: DISCOUNT_MUTATION, variables }),
  });

  const body = await resp.json().catch(() => ({}));

  // 10) Record Shopify response back in Supabase
  const { error: recordErr } = await supabase.rpc(
    "process_offer_shopify_response",
    { discountsID, response: body }, // if your SQL arg is discountsId, change key to discountsId
  );
  if (recordErr) {
    return json({ step: "record-response", error: recordErr.message, httpStatus: resp.status, body }, { status: 500 });
  }

  // 11) Inspect Shopify userErrors
  const userErrors = body?.data?.discountCodeBasicCreate?.userErrors ?? [];
  const hasErrors = Array.isArray(userErrors) && userErrors.length > 0;

  // 12) Final response back to the theme app
  // Pull latest computed values in case your RPC updated discountCode etc.
  const { data: finalOffer } = await supabase
    .from("offers")
    .select("offerPrice, approvedDiscountPrice, discountPercent, discountCode, offerExpiryMinutes")
    .eq("id", offersID)
    .maybeSingle();

  const discountCode =
    body?.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes?.edges?.[0]?.node?.code
    ?? finalOffer?.discountCode
    ?? null;

  return json({
    ok: !hasErrors,
    phase: "shopify-posted",
    result: {
      offersID, cartsID, consumersID, shopsID, discountsID,
      status: "AutoAccept",
      offerPrice: finalOffer?.offerPrice ?? null,
      approvedDiscountPrice: finalOffer?.approvedDiscountPrice ?? null,
      discountPercent: finalOffer?.discountPercent ?? null,
      discountCode,
      offerExpiryMinutes: finalOffer?.offerExpiryMinutes ?? null,
      shopify: {
        httpStatus: resp.status,
        userErrors,
        response: body,
      },
    },
  });
});