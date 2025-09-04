// app/components/KeepContextLink.tsx
import { Link, type LinkProps, useLocation } from "@remix-run/react";

export function KeepContextLink({ to, ...rest }: LinkProps) {
  const { search } = useLocation(); // includes ?host=...&shop=...
  const href = typeof to === "string" ? `${to}${search || ""}` : to;
  return <Link prefetch="intent" to={href} {...rest} />;
}

