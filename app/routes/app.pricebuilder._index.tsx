// app/routes/app.pricebuilder._index.tsx
import { EditDrawer } from "../components/pricebuilder/EditDrawer";
import { FiltersBar } from "../components/pricebuilder/FiltersBar";
import { VariantsTable } from "../components/pricebuilder/VariantsTable";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, useNavigate } from "@remix-run/react";
import {   Page, Layout, Card, IndexTable, Button, Text, Modal, Banner, Box, InlineStack
} from "@shopify/polaris";
import { getShopSession } from "../lib/session/shopSession.server";
import createClient from "../utils/supabase/server";
import type { Database } from "../../supabase/database.types";
import { useState, useMemo, useEffect } from "react";


const supabase = createClient();






const { data, error } = await supabase.rpc("upsert_variant_pricing", {
p_shops_id: session.shopsID,
p_rows: payload,
});


if (error) {
return json({ ok: false, error: error.message }, { headers, status: 400 });
}
return json({ ok: true, affected: data?.[0]?.affected ?? 0 }, { headers });
}


return json({ ok: false, error: "Unknown intent" }, { headers, status: 400 });
}


export default function PriceBuilderIndex() {
const { rows } = useLoaderData<typeof loader>();
const fetcher = useFetcher();
const [selected, setSelected] = useState<string[]>([]); // selected variantsGID
const [single, setSingle] = useState<VPView | null>(null);
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingPayload, setPendingPayload] = useState<any[]>([]);


// Submit helper
const submitUpsert = (payload: any[]) => {
setPendingPayload(payload);
setConfirmOpen(true);
};


const onConfirm = () => {
const fd = new FormData();
fd.append("intent", "upsert-pricing");
fd.append("payload", JSON.stringify(pendingPayload));
fetcher.submit(fd, { method: "post" });
setConfirmOpen(false);
};


return (
<Page title="PriceBuilder">
<Layout>
<Layout.Section>
<Card>
<FiltersBar />
<VariantsTable rows={rows} selected={selected} onSelect={setSelected} onSingleOpen={setSingle} />
</Card>
</Layout.Section>


{single && (
<EditDrawer
row={single}
onClose={() => setSingle(null)}
onApply={(computed) => submitUpsert([computed])}
/>
)}


{selected.length > 1 && (
<BulkEditor
selected={rows.filter(r => selected.includes(r.variantsGID))}
onApply={(batch) => submitUpsert(batch)}
/>
)}


<Modal
open={confirmOpen}
onClose={() => setConfirmOpen(false)}
title="Confirm pricing update"
primaryAction={{ content: "Confirm", onAction: onConfirm }}
secondaryActions={[{ content: "Cancel", onAction: () => setConfirmOpen(false) }]}
>
<Modal.Section>
<Text as="p">You're about to update {pendingPayload.length} variant(s). Proceed?</Text>
</Modal.Section>
</Modal>
</Layout>
</Page>
);
}