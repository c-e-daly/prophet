// app/utils/format.ts

/** Format numbers in cents into USD currency string */
export const formatCurrencyUSD = (cents?: number | null) => {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
};

// Dollars -> USD using the existing cents-based formatter
export const formatUSD = (dollars?: number | null) =>
  formatCurrencyUSD(Math.round((dollars ?? 0) * 100));

/** Format an ISO string, timestamp, or Date into "MMM DD, YYYY, HH:MM" */
export const formatDateTime = (input?: string | number | Date | null) => {
  if (!input) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(input));
};

/** Format date only (no time), e.g. "Aug 22, 2025" */
export const formatDate = (input?: string | number | Date | null) => {
  if (!input) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(input));
};

/** Format numbers with commas, e.g. 12345 -> "12,345" */
export const formatNumber = (num?: number | null) => {
  return new Intl.NumberFormat("en-US").format(num ?? 0);
};

/** Normalize email to lowercase */
export const formatEmail = (email?: string | null) => {
  return email?.toString().trim().toLowerCase() ?? "";
};

/** Title-case a string (capitalize first letter of each word) */
export const formatTitleCase = (str?: string | null) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

/** Truncate string to length with ellipsis */
export const truncate = (str?: string | null, max = 50) => {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
};

/** ---------- Date input helpers ---------- */

/**
 * Convert an ISO string (UTC) to an <input type="datetime-local"> value.
 * Returns "" if input is falsy or invalid. Preserves the user's local wall time.
 * Example: "2025-09-02T14:05:00.000Z" -> "2025-09-02T10:05" (depending on TZ)
 */
export const isoToLocalInput = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

/**
 * Convert an <input type="datetime-local"> value to ISO string (UTC) or null.
 * Returns null for empty/invalid values.
 * Example: "2025-09-02T10:05" (local) -> "2025-09-02T14:05:00.000Z" (UTC ISO)
 */
export const localInputToIso = (local?: string | null): string | null => {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}


// Extracts the first name from a full name string
// @param consumerName - Full name string (e.g., "Jason Bourne")
// @returns First name only (e.g., "Jason") or null if invalid input
///
export function parseFirstName(consumerName: string | null | undefined): string | null {
  if (!consumerName || typeof consumerName !== 'string') {
    return null;
  }
  
  const trimmed = consumerName.trim();
  if (!trimmed) {
    return null;
  }
  
  // Split by space and return first part
  const firstName = trimmed.split(' ')[0];
  return firstName || null;
}

// import { parseFirstName } from "../utils/format";
// const firstName = parseFirstName(payload.consumerName);

export function parseLastName(consumerName: string | null | undefined): string | null {
  if (!consumerName || typeof consumerName !== 'string') {
    return null;
  }
  
  const trimmed = consumerName.trim();
  if (!trimmed) {
    return null;
  }
  
  const parts = trimmed.split(' ');
  
  // If only one word, no last name
  if (parts.length <= 1) {
    return null;
  }
  
  // Join everything after the first word
  const lastName = parts.slice(1).join(' ');
  return lastName || null;
}

// import { parseLastName } from "../utils/format";
// const firstName = parseLastName(payload.consumerName);