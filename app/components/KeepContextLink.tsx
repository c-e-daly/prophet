// app/components/KeepHostLink.tsx
import { Link, type LinkProps, useLocation } from "@remix-run/react";

export function KeepHostLink({ to, ...rest }: LinkProps) {
  const { search } = useLocation(); // includes ?host=...&shop=...
  const href = typeof to === "string" ? `${to}${search || ""}` : to;
  return <Link prefetch="intent" to={href} {...rest} />;
}

