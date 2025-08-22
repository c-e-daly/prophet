// app/components/BreadcrumbsBar.tsx
import { Link, useLocation } from "@remix-run/react";
import { InlineStack, Text } from "@shopify/polaris";

type Crumb = { to: string; label: string; relative?: "route" | "path" };

export function BreadcrumbsBar({ items }: { items: Crumb[] }) {
  const { search } = useLocation(); // preserves ?shop=&host= etc.

  return (
    <nav aria-label="Breadcrumbs" style={{ marginBottom: 8 }}>
      <InlineStack gap="100" align="start">
        {items.map((c, i) => (
          <InlineStack key={i} gap="100" align="center">
            {i > 0 && <Text as="span">/</Text>}
            <Link
              to={{ pathname: c.to, search }}
              relative={c.relative ?? "route"}
              prefetch="intent"
              replace
              className="unstyled-link" // optional; remove default link style
            >
              {c.label}
            </Link>
          </InlineStack>
        ))}
      </InlineStack>
    </nav>
  );
}
