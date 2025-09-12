// app/routes/app.portfolios.tsx
import { Outlet } from "@remix-run/react";
import { Page } from "@shopify/polaris";


export default function PortfoliosLayout() {
  return (
    <Page>
      <Outlet />
    </Page>
  );
}
