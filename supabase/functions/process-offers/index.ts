// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// ---- ENV ----
// Set these in your Supabase project (Project Settings → Functions → Environments)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // service key so we can read shop auth
const SHOPIFY_API_VERSION = Deno.env.get("SHOPIFY_API_VERSION") ?? "2024-10";

// Helper: JSON response
const json = (body: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json; charset=utf-8", ...init.headers },
  });

// Shopify mutation (matches your “very specific” body)
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
            edges { node { code } }
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
    userErrors { field message }
  }
}`;

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
    sku?: string;
    quantity?: number;
    price?: number;
    lineTotal?: number;
    cartToken?: string;
    template?: string;
    sellingPrice?: number; // if present
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
  } catch (_) {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload?.storeUrl || !payload?.cartToken) {
    return json({ error: "storeUrl and cartToken are required" }, { status: 400 });
  }

  // 1) UPSERT CONSUMER AND LINK CONSUMER TO SHOP CONSUMERSHOP
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
    customerShopifyGID?: string | null;
  };
  if (!consumersID || !shopsID) {
    return json({ step: "consumers", error: "Missing consumersId or shopsId" }, { status: 500 });
  }

  // 2) UPSERT CART AND LINK TO CONSUMER AND SHOP
  const { data: cartRes, error: cartErr } = await supabase.rpc(
    "process_offer_upsert_carts",
    { payload, consumersID, shopsID },
  );
  if (cartErr) return json({ step: "carts", error: cartErr.message }, { status: 500 });

  const cartsId = cartRes?.[0]?.cartsId as number | undefined;
  if (!cartsId) return json({ step: "carts", error: "Missing cartsId" }, { status: 500 });

  // 3) UPSERT CART ITEMS AND LINK TO CONSUMER, SHOP, CART
  const { data: itemsRes, error: itemsErr } = await supabase.rpc(
    "process_offer_upsert_cartitems",
    { payload, cartsId, consumersID, shopsID },
  );
  if (itemsErr) return json({ step: "cartitems", error: itemsErr.message }, { status: 500 });

  // 4) UPSERT OFFER AND LINK TO CONSUMER, SHOP, CART, AND CART ITEMS 
  const { data: offerRes, error: offerErr } = await supabase.rpc(
    "process_offer_upsert_offers",
    { payload, cartsId, consumersID, shopsID },
  );
  if (offerErr) return json({ step: "offers", error: offerErr.message }, { status: 500 });

  const offersId = offerRes?.[0]?.offersId as number | undefined;
  if (!offersId) return json({ step: "offers", error: "Missing offersId" }, { status: 500 });

  // 5) EVALUATE THE OFFER AND CREATE RESPONSE
  const { data: offerRow, error: offerGetErr } = await supabase
    .from("offers")
    .select(`
      id, carts, consumers, shops, cartToken,
      offerStatus, offerPrice, offerDiscountPrice, approvedDiscountPrice,
      discountPercent, discountCode, discounts,
      offerCreateDate, modifiedDate,
      offerExpiryMinutes,
      programs, programsDeclineRate, programAcceptRate
    `)
    .eq("id", offersId)
    .maybeSingle();

  if (offerGetErr || !offerRow) {
    return json({ step: "offers-read", error: offerGetErr?.message ?? "Offer not found" }, { status: 500 });
  }

  // Short-circuit response for Pending/Declined
  if (offerRow.offerStatus === "PendingReview" || offerRow.offerStatus === "AutoDecline") {
    return json({
      ok: true,
      phase: "evaluated",
      result: {
        offersId,
        cartsId,
        consumersID,
        shopsID,
        status: offerRow.offerStatus,
        offerPrice: offerRow.offerPrice,
        approvedDiscountPrice: offerRow.approvedDiscountPrice ?? null,
        discountPercent: offerRow.discountPercent ?? null,
      },
    });
  }

  // 6) ON AUTOACCEPT CREATE DISCOUNT ROW
  let discountsId = offerRow.discounts as number | null;
  if (!discountsId) {
    const { data: d, error: dErr } = await supabase
      .from("discounts")
      .select("id")
      .eq("offers", offersId)
      .maybeSingle();
    if (dErr) return json({ step: "discounts-lookup", error: dErr.message }, { status: 500 });
    discountsId = d?.id ?? null;
  }

  if (!discountsId) {
    return json({
      step: "discounts-missing",
      error:
        "Offer is AutoAccept but no discount row was created. Check the AFTER UPDATE trigger that calls create_discount_for_autoaccepted_offer.",
    }, { status: 500 });
  }

  // 7) CREATE SHOPIFY VARIABLES FOR DISCOUNT POSTING AND RESPONSE
  const { data: variables, error: varsErr } = await supabase.rpc(
    "process_offer_create_shopify_variables",
    { discountsId },
  );
  if (varsErr) {
    return json({ step: "build-variables", error: varsErr.message, discountsId }, { status: 500 });
  }

  // 8) GATHER CFREDENTIALS TO POST TO SHOPIFY
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

  // 9) POST DISCOUNT TO SHOPIFY AND GATHER RESPONSE
  const shopifyEndpoint = `https://${shop.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const resp = await fetch(shopifyEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": auth.accessToken,
    },
    body: JSON.stringify({
      query: DISCOUNT_MUTATION,
      variables, // already matches Shopify’s expected shape
    }),
  });

  const body = await resp.json().catch(() => ({}));

  // 10) RECORD SHOPIFY DISCOUNT RESPONSE 
  const { error: recordErr } = await supabase.rpc(
    "process_offer_create_shopify_response",
    { discountsId, response: body },
  );
  if (recordErr) {
    return json({ step: "record-response", error: recordErr.message, httpStatus: resp.status, body }, { status: 500 });
  }

  // 11) DETECT ERRORS IN SHOPIFY DISCOUNT RESPONSE
  const userErrors = body?.data?.discountCodeBasicCreate?.userErrors ?? [];
  const hasErrors = Array.isArray(userErrors) && userErrors.length > 0;

  // 12) SEND RESPONSE TO CONSUMER IN SHOPIFY
  return json({
    ok: !hasErrors,
    phase: "shopify-posted",
    result: {
      offersId,
      cartsId,
      consumersID,
      shopsID,
      discountsId,
      status: offerRow.offerStatus,
      discountCode: body?.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes?.edges?.[0]?.node?.code
        ?? offerRow.discountCode
        ?? null,
      shopify: {
        httpStatus: resp.status,
        userErrors,
        response: body,
      },
    },
  });
});
