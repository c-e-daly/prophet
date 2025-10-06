// app/routes/app.pricebuilder.move.ts
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { getFlashSession, commitFlashSession } from "../sessions.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const raw = formData.get("variantIds");

  let ids: number[] = [];
  if (typeof raw === "string" && raw.trim() !== "") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        ids = parsed.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      }
    } catch {
      // ignore; we'll handle as empty
    }
  }

  if (ids.length === 0) {
   console.log(ids, " received to move");
    return redirect("/app/pricebuilder");
  }

  const session = await getFlashSession(request.headers.get("Cookie"));
  session.flash("bulkEditVariantIds", ids);

  return redirect("/app/pricebuilder/bulkeditor", {
    headers: {
      "Set-Cookie": await commitFlashSession(session),
    },
  });
}
