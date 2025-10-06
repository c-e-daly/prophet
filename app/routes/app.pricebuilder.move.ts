// app/routes/app.pricebuilder.move.ts
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { getFlashSession, commitFlashSession } from "../sessions.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const raw = formData.get("variantIds");
  const ids = Array.isArray(raw) ? raw : typeof raw === "string" ? JSON.parse(raw) : [];

  const session = await getFlashSession(request.headers.get("Cookie"));
  session.flash("bulkEditVariantIds", ids);

  return redirect("/app/pricebuilder/bulkeditor", {
    headers: {
      "Set-Cookie": await commitFlashSession(session),
    },
  });
}
