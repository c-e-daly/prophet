import { useState } from "react";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { AppProvider as PolarisAppProvider, Button, Card, FormLayout, Page, Text, TextField } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css"; // Direct CSS import

import { login } from "../utils/shopify/shopify.server";
import { loginErrorMessage } from "./auth.login/error.server";

type LoginErrors = {
  shop?: string;
};

type LoaderData = {
  errors: LoginErrors;
  polarisTranslations: typeof polarisTranslations;
};

export const loader = async ({ request }: LoaderFunctionArgs): Promise<LoaderData> => {
  const errors = loginErrorMessage(await login(request));
  return { errors, polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs): Promise<{ errors: LoginErrors }> => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<{ errors: LoginErrors }>();
  const [shop, setShop] = useState("");

  const errors = actionData?.errors || loaderData.errors;

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in to PROPHET
              </Text>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors?.shop}
              />
              <Button submit>Connect Store</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}