// a tiny adapter somewhere global, e.g. app/components/RemixPolarisLink.tsx
import { Link as RemixLink } from "@remix-run/react";

export function RemixPolarisLink({ url = "#", children, ...rest }: any) {
  return (
    <RemixLink to={url} {...rest}>
      {children}
    </RemixLink>
  );
}
