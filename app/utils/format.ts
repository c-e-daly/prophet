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
