// app/routes/auth.$.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "../utils/shopify/shopify.server";
import createClient from "../utils/supabase/server";
import { setShopSessionInStorage } from "../lib/session/shopSession.server";
import type { CompleteShopSession } from "../lib/types/shopSession";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Shopify OAuth / session
    const { admin, session } = await authenticate.admin(request);
    if (!session?.shop || !session.accessToken) throw new Error("Auth missing shop or token");

    // Persist/update shop + auth in Supabase
    const { shopsRow, shopsId, shopsBrandName } = await storeShopData(session, admin);

    // Build a COMPLETE session (no partials)
    const completeSession: CompleteShopSession = {
      shopDomain: session.shop,
      shopName: session.shop.replace(".myshopify.com", ""),
      hasToken: true,
      shops: shopsRow,           // full row if your type expects it
      shopsID: shopsRow.id,         // use exact casing your app expects
      shopsBrandName: shopsBrandName
     
    };

    const cookie = await setShopSessionInStorage(request, completeSession);

    // Preserve host for embedded
    const url = new URL(request.url);
    const host = url.searchParams.get("host");

    const appUrl = `/app?shop=${encodeURIComponent(session.shop)}${host ? 
      `&host=${encodeURIComponent(host)}` : ""}`;
    return redirect(appUrl, { headers: { "Set-Cookie": cookie } });

  } catch (error) {
    // If OAuth needs to redirect (302), let it through
    if (error instanceof Response && error.status === 302) throw error;
    console.error("❌ Auth failed:", error);
    return redirect("/app?error=auth_failed");
  }
}

async function storeShopData(session: any, admin: any) {
  const supabase = createClient();

  // Fetch shop info from Shopify Admin REST
  const shopResponse = await admin.rest.resources.Shop.all({ session });
  const shopInfo = shopResponse.data?.[0];
  if (!shopInfo) throw new Error("Could not fetch shop info");

  // Upsert into shops (match your actual camelCase columns)
  const { data: shopsRow, error: shopError } = await supabase
    .from("shops")
    .upsert(
      {
        shopGID: shopInfo.id,
        shopDomain: session.shop,
        brandName: shopInfo.name,
        companyLegalName: shopInfo.name,
        storeCurrency: shopInfo.currency,
        commercePlatform: "shopify",
        companyPhone: shopInfo.phone || null,
        companyAddress: shopInfo.address1
          ? {
              address1: shopInfo.address1,
              address2: shopInfo.address2,
              city: shopInfo.city,
              province: shopInfo.province,
              country: shopInfo.country,
              zip: shopInfo.zip,
            }
          : null,
        createDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
      },
      { onConflict: "shopDomain" }
    )
    .select()
    .single();

  if (shopError || !shopsRow) {
    console.error("Shop upsert failed:", shopError);
    throw new Error("Shop upsert failed");
  }

  // Upsert into shopauth (align column names to your table)
  const { error: authError } = await supabase
    .from("shopauth")
    .upsert(
      {
        id: session.shop,
        shop: shopsRow.id,
        shopGID: shopInfo.id,
        shopName: shopInfo.name, // rename to camelCase if your schema is camel here too
        accessToken: session.accessToken,
        shopifyScope: session.scope,
        createDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        created_by: "oauth_callback",
      },
      { onConflict: "id" }
    );

  if (authError) throw authError;

  return {
    shopsRow,
    shopsId: shopsRow.id,
    shopsBrandName: shopsRow.brandName ?? shopInfo.name,
  };
}

export default function AuthRoute() {
  return null; // never rendered; loader handles redirects
}
