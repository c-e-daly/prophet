import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { useFetcher, } from "@remix-run/react";
import { Page, Layout, Text, Card, Button, BlockStack, Box, List, Link, InlineStack, } from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../lib/shopify.server";
export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return null;
};
export const action = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const color = ["Red", "Orange", "Yellow", "Green"][Math.floor(Math.random() * 4)];
    const response = await admin.graphql(`#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`, {
        variables: {
            product: {
                title: `${color} Snowboard`,
            },
        },
    });
    const responseJson = await response.json();
    const product = responseJson.data?.productCreate?.product;
    const variantId = product?.variants?.edges[0]?.node?.id;
    const variantResponse = await admin.graphql(`#graphql
      mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
            id
            price
            barcode
            createdAt
          }
        }
      }`, {
        variables: {
            productId: product.id,
            variants: [{ id: variantId, price: "100.00" }],
        },
    });
    const variantResponseJson = await variantResponse.json();
    return {
        product,
        variant: variantResponseJson?.data?.productVariantsBulkUpdate?.productVariants,
    };
};
export default function Index() {
    const fetcher = useFetcher();
    const shopify = useAppBridge();
    const isLoading = ["loading", "submitting"].includes(fetcher.state) &&
        fetcher.formMethod === "POST";
    const productId = fetcher.data?.product?.id.replace("gid://shopify/Product/", "");
    useEffect(() => {
        if (productId) {
            shopify.toast?.show?.("Product created");
        }
    }, [productId, shopify]);
    const generateProduct = () => fetcher.submit({}, { method: "POST" });
    return (_jsxs(Page, { children: [_jsx(TitleBar, { title: "Remix app template", children: _jsx("button", { onClick: generateProduct, children: "Generate a product" }) }), _jsx(BlockStack, { gap: "500", children: _jsxs(Layout, { children: [_jsx(Layout.Section, { children: _jsx(Card, { children: _jsxs(BlockStack, { gap: "500", children: [_jsxs(BlockStack, { gap: "200", children: [_jsx(Text, { as: "h2", variant: "headingMd", children: "Congrats on creating a new Shopify app \uD83C\uDF89" }), _jsxs(Text, { variant: "bodyMd", as: "p", children: ["This embedded app template uses", " ", _jsx(Link, { url: "https://shopify.dev/docs/apps/tools/app-bridge", target: "_blank", removeUnderline: true, children: "App Bridge" }), " ", "interface examples like an", " ", _jsx(Link, { url: "/app/additional", removeUnderline: true, children: "additional page in the app nav" }), ", as well as an", " ", _jsx(Link, { url: "https://shopify.dev/docs/api/admin-graphql", target: "_blank", removeUnderline: true, children: "Admin GraphQL" }), " ", "mutation demo."] })] }), _jsxs(BlockStack, { gap: "200", children: [_jsx(Text, { as: "h3", variant: "headingMd", children: "Get started with products" }), _jsxs(Text, { as: "p", variant: "bodyMd", children: ["Generate a product with GraphQL and get the JSON output. Learn more about the", " ", _jsx(Link, { url: "https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate", target: "_blank", removeUnderline: true, children: "productCreate" }), " ", "mutation."] })] }), _jsxs(InlineStack, { gap: "300", children: [_jsx(Button, { loading: isLoading, onClick: generateProduct, children: "Generate a product" }), fetcher.data?.product && (_jsx(Button, { url: `shopify:admin/products/${productId}`, target: "_blank", variant: "plain", children: "View product" }))] }), fetcher.data?.product && (_jsxs(_Fragment, { children: [_jsx(Text, { as: "h3", variant: "headingMd", children: "productCreate mutation" }), _jsx(Box, { padding: "400", background: "bg-surface-active", borderWidth: "025", borderRadius: "200", borderColor: "border", overflowX: "scroll", children: _jsx("pre", { style: { margin: 0 }, children: _jsx("code", { children: JSON.stringify(fetcher.data.product, null, 2) }) }) }), _jsx(Text, { as: "h3", variant: "headingMd", children: "productVariantsBulkUpdate mutation" }), _jsx(Box, { padding: "400", background: "bg-surface-active", borderWidth: "025", borderRadius: "200", borderColor: "border", overflowX: "scroll", children: _jsx("pre", { style: { margin: 0 }, children: _jsx("code", { children: JSON.stringify(fetcher.data.variant, null, 2) }) }) })] }))] }) }) }), _jsx(Layout.Section, { variant: "oneThird", children: _jsxs(BlockStack, { gap: "500", children: [_jsx(Card, { children: _jsxs(BlockStack, { gap: "200", children: [_jsx(Text, { as: "h2", variant: "headingMd", children: "App template specs" }), _jsxs(BlockStack, { gap: "200", children: [_jsxs(InlineStack, { align: "space-between", children: [_jsx(Text, { as: "span", variant: "bodyMd", children: "Framework" }), _jsx(Link, { url: "https://remix.run", target: "_blank", removeUnderline: true, children: "Remix" })] }), _jsxs(InlineStack, { align: "space-between", children: [_jsx(Text, { as: "span", variant: "bodyMd", children: "Database" }), _jsx(Link, { url: "https://www.prisma.io/", target: "_blank", removeUnderline: true, children: "Prisma" })] }), _jsxs(InlineStack, { align: "space-between", children: [_jsx(Text, { as: "span", variant: "bodyMd", children: "Interface" }), _jsxs("span", { children: [_jsx(Link, { url: "https://polaris.shopify.com", target: "_blank", removeUnderline: true, children: "Polaris" }), ", ", _jsx(Link, { url: "https://shopify.dev/docs/apps/tools/app-bridge", target: "_blank", removeUnderline: true, children: "App Bridge" })] })] }), _jsxs(InlineStack, { align: "space-between", children: [_jsx(Text, { as: "span", variant: "bodyMd", children: "API" }), _jsx(Link, { url: "https://shopify.dev/docs/api/admin-graphql", target: "_blank", removeUnderline: true, children: "GraphQL API" })] })] })] }) }), _jsx(Card, { children: _jsxs(BlockStack, { gap: "200", children: [_jsx(Text, { as: "h2", variant: "headingMd", children: "Next steps" }), _jsxs(List, { children: [_jsxs(List.Item, { children: ["Build an", " ", _jsx(Link, { url: "https://shopify.dev/docs/apps/getting-started/build-app-example", target: "_blank", removeUnderline: true, children: "example app" })] }), _jsxs(List.Item, { children: ["Explore Shopify\u2019s API with", " ", _jsx(Link, { url: "https://shopify.dev/docs/apps/tools/graphiql-admin-api", target: "_blank", removeUnderline: true, children: "GraphiQL" })] })] })] }) })] }) })] }) })] }));
}
