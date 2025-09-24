// app/routes/apps/process.offer.ts
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
          phone 
        } 
      }
    }
  }
`;

interface CustomerResult {
  customerGID: string | null;
  email: string | null;
  phone: string | null;
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
    return { customerGID: null, email: null, phone: null };
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
        email: customer.email ?? email ?? null,
        phone: customer.phone ?? phone ?? null
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
          email: existingCustomer.email ?? email ?? null,
          phone: existingCustomer.phone ?? phone ?? null
        };
      }
    }
    
    // If we get here, something went wrong
    console.error('Customer creation failed:', { userErrors, response });
    return { customerGID: null, email: null, phone: null};
    
  } catch (error) {
    console.error('Shopify customer creation error:', error);
    return { customerGID: null, email: null, phone: null};
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
      displayName: payload.consumerName ?? null,
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