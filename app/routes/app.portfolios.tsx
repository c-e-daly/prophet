import { Outlet } from "@remix-run/react";

/** Keep parent as a pure layout so children fully control the page. */
export default function PortfoliosRoot() {
  return <Outlet />;
}
/*
export default function Portfolios() {
  return (
    <Page>
        <Outlet />           
    </Page>
  );
}*/

