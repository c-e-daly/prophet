import { Outlet, useLocation } from "@remix-run/react";

/**
 * Keep this parent EMPTY and let children own their <Page> wrappers.
 * Keying by pathname guarantees the child remounts on path change.
 */
export default function Campaigns() {
  const location = useLocation();
  return <Outlet key={location.pathname} />;
}
