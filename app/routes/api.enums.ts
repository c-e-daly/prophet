import { json } from "@remix-run/node";
import { getEnumsCached } from "../lib/enumCache.server";

export async function loader() {
  try {
    const enums = await getEnumsCached();
    return json(enums);
  } catch (error) {
    console.error('API error fetching enums:', error);
    throw json(
      { error: 'Failed to fetch enums' },
      { status: 500 }
    );
  }
}