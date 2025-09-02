// app/routes/app.campaigns.programs.tsx
import * as React from "react";
import { Outlet} from "@remix-run/react";

export default function ProgramsLayout() {

  // ... your layout UI here ...
  return (
    <>
      
      <Outlet  />
    </>
  );
}
