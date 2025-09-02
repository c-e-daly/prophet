// app/routes/app.campaigns.programs.tsx
import * as React from "react";
import { Outlet, useOutletContext } from "@remix-run/react";
import type { ShopSession } from "../lib/queries/getShopSession";

export default function ProgramsLayout() {
  const shopSession = useOutletContext<ShopSession>();
  // ... your layout UI here ...
  return (
    <>
      {/* your page chrome */}
      <Outlet context={shopSession} />
    </>
  );
}
