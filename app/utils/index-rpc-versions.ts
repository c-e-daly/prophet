// /tools/index-rpc-versions.ts
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOTS = [
  "supabase/functions/rpc",
  "supabase/views",
  "supabase/triggers",
  "supabase/sql", // add more folders if you keep SQL elsewhere
];

type Meta = {
  name: string;
  version: number;
  updated_on?: string;
  notes?: string;
  file_path: string;
  git_sha?: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const GIT_SHA = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "";

function parseHeader(sql: string): Partial<Meta> {
  // Only scan the first 80 lines to keep it fast
  const lines = sql.split(/\r?\n/).slice(0, 80);

  let name = "";
  let version: number | undefined;
  let updated_on: string | undefined;
  const notesLines: string[] = [];

  let collectingNotes = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith("--")) continue;

    // -- Function: schema.fn_name
    const mFunc = line.match(/^--\s*Function:\s*(.+)$/i);
    if (mFunc) {
      name = mFunc[1].trim();
      continue;
    }

    // -- Version: 1.4
    const mVer = line.match(/^--\s*Version:\s*([0-9]+(?:\.[0-9]+)?)$/i);
    if (mVer) {
      version = Number(mVer[1]);
      continue;
    }

    // -- Updated: 2025-10-10
    const mUpd = line.match(/^--\s*Updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})$/i);
    if (mUpd) {
      updated_on = mUpd[1];
      continue;
    }

    // -- Notes:
    if (/^--\s*Notes:/.test(line)) {
      collectingNotes = true;
      continue;
    }

    if (collectingNotes) {
      const noteLine = line.replace(/^--\s?/, "");
      // Stop notes when we hit a blank non-comment SQL line
      if (!noteLine && notesLines.length > 0) break;
      notesLines.push(noteLine);
    }
  }

  const notes = notesLines
    .map((s) => s.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean)
    .join("\n");

  return { name, version, updated_on, notes };
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && full.endsWith(".sql")) yield full;
  }
}

async function upsert(meta: Meta) {
  const { error } = await supabase.from("rpc_versions").upsert(
    {
      name: meta.name,
      version: meta.version,
      updated_on: meta.updated_on || null,
      notes: meta.notes || null,
      file_path: meta.file_path,
      git_sha: meta.git_sha || null,
      modified_at: new Date().toISOString(),
    },
    { onConflict: "name" }
  );
  if (error) throw error;
}

(async () => {
  const results: Meta[] = [];
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      const sql = fs.readFileSync(file, "utf8");
      const parsed = parseHeader(sql);
      if (!parsed.name || !parsed.version) {
        // Skip files without standard header
        continue;
      }
      results.push({
        name: parsed.name!,
        version: parsed.version!,
        updated_on: parsed.updated_on,
        notes: parsed.notes,
        file_path: file,
        git_sha: GIT_SHA || undefined,
      });
    }
  }

  if (!results.length) {
    console.log("No SQL files with standard headers found.");
    process.exit(0);
  }

  for (const r of results) {
    await upsert(r);
    console.log(`Indexed ${r.name} v${r.version} (${r.file_path})`);
  }
  console.log(`Done. Indexed ${results.length} functions/views.`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
