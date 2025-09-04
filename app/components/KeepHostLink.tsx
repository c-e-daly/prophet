// app/components/KeepHostLink.tsx
import { Link, type LinkProps, useLocation } from "@remix-run/react";

function mergeSearch(base: string | undefined, extra: URLSearchParams) {
  const merged = new URLSearchParams(base || "");
  const host = extra.get("host");
  const shop = extra.get("shop");
  // keep ONLY what App Bridge needs
  merged.delete("hmac");
  merged.delete("id_token");
  merged.delete("embedded");
  if (host) merged.set("host", host);
  if (shop) merged.set("shop", shop);
  const qs = merged.toString();
  return qs ? `?${qs}` : "";
}

export function KeepHostLink({ to, ...rest }: LinkProps) {
  const { search } = useLocation();
  const current = new URLSearchParams(search);

  if (typeof to === "string") {
    const u = new URL(to, "https://dummy.local"); // parse reliably
    const href = `${u.pathname}${mergeSearch(u.search, current)}${u.hash || ""}`;
    return <Link prefetch="intent" to={href} {...rest} />;
  }

  // object form
  const pathname = to.pathname ?? "";
  const searchOut = mergeSearch(typeof to.search === "string" ? to.search : "", current);
  return <Link prefetch="intent" to={{ ...to, pathname, search: searchOut }} {...rest} />;
}
