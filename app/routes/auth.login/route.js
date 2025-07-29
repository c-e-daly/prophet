import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Form, useActionData, useLoaderData, } from "@remix-run/react";
import { AppProvider as PolarisAppProvider, Button, Card, FormLayout, Page, Text, TextField, } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "../../lib/shopify.server";
import { loginErrorMessage } from "./error.server";
export const links = () => [
    { rel: "stylesheet", href: polarisStyles },
];
export const loader = async ({ request }) => {
    const errors = loginErrorMessage(await login(request));
    return { errors, polarisTranslations };
};
export const action = async ({ request }) => {
    const errors = loginErrorMessage(await login(request));
    return { errors };
};
export default function Auth() {
    const loaderData = useLoaderData();
    const actionData = useActionData();
    const [shop, setShop] = useState("");
    const errors = actionData?.errors || loaderData.errors;
    return (_jsx(PolarisAppProvider, { i18n: loaderData.polarisTranslations, children: _jsx(Page, { children: _jsx(Card, { children: _jsx(Form, { method: "post", children: _jsxs(FormLayout, { children: [_jsx(Text, { variant: "headingMd", as: "h2", children: "Log in" }), _jsx(TextField, { type: "text", name: "shop", label: "Shop domain", helpText: "example.myshopify.com", value: shop, onChange: setShop, autoComplete: "on", error: errors?.shop }), _jsx(Button, { submit: true, children: "Log in" })] }) }) }) }) }));
}
