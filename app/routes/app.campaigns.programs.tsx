// app/routes/app.campaigns.programs.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet} from "@remix-run/react";
import { requireCompleteShopSession } from "../lib/session/shopAuth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { shopSession, headers } = await requireCompleteShopSession(request);
  
  return json(
    { shopSession },
    { headers: headers ? headers : undefined }
  );
}


export default function ProgramsLayout() {

  // ... your layout UI here ...
  return (
    <>
      
      <Outlet  />
    </>
  );
}
