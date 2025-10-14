// app/utils/statusHelpers.ts
import { formatDateTime } from "./format";

/**
 * Map campaign/program status to Polaris Badge tone
 */
export function badgeToneForStatus(
  status?: string
): "success" | "warning" | "critical" | "attention" | "info" | undefined {
  if (!status) return undefined;
  
  const s = status.toUpperCase();
  
  switch (s) {
    case "ACTIVE":
      return "success";
    case "PAUSED":
      return "warning";
    case "ARCHIVED":
    case "COMPLETE":
      return "critical";
    case "DRAFT":
    case "PENDING":
      return "info";
    default:
      return undefined;
  }
}

/**
 * Format date range for display
 * @example "Oct 31, 2025, 04:00 AM — Oct 14, 2025, 07:59 PM"
 */
export function formatRange(startISO?: string, endISO?: string): string {
  const s = startISO ? formatDateTime(startISO) : "";
  const e = endISO ? formatDateTime(endISO) : "";
  
  if (s && e) return `${s} — ${e}`;
  if (s) return s;
  if (e) return e;
  return "No dates set";
}