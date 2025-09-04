import { Link, type LinkProps, useLocation, useResolvedPath } from "@remix-run/react";

type KeepContextLinkProps = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];
  /** which params to preserve from the current location if absent on `to` */
  preserveKeys?: string[];
};

export function KeepContextLink({
  to,
  preserveKeys = ["host", "shop", "embedded", "id_token", "hmac"],
  ...rest
}: KeepContextLinkProps) {
  const location = useLocation();

  // Resolve `to` into a concrete path object (pathname, search, hash)
  const resolved = useResolvedPath(to as any);

  const currentQs = new URLSearchParams(location.search);
  const nextQs = new URLSearchParams(resolved.search ?? "");

  // Copy whitelisted keys from current location unless explicitly set on the target
  for (const key of preserveKeys) {
    if (!nextQs.has(key) && currentQs.has(key)) {
      const val = currentQs.get(key);
      if (val != null) nextQs.set(key, val);
    }
  }

  const nextSearch = nextQs.toString();
  const finalTo = {
    pathname: resolved.pathname,
    search: nextSearch ? `?${nextSearch}` : "",
    hash: resolved.hash ?? "",
  };

  return <Link prefetch="intent" to={finalTo} {...rest} />;
}



/*
app/components/KeepContextLink.tsx
import { Link, type LinkProps, useLocation } from "@remix-run/react";

export function KeepContextLink({ to, ...rest }: LinkProps) {
  const { search } = useLocation(); // includes ?host=...&shop=...
  const href = typeof to === "string" ? `${to}${search || ""}` : to;
  return <Link prefetch="intent" to={href} {...rest} />;
}

*/