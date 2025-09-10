// app/routes/app.campaigns.programs.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet} from "@remix-run/react";
import { getShopSession } from "../lib/session/shopSession.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getShopSession(request);
  
  return json(
    { session },
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
