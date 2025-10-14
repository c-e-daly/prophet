// app/components/AppLink.tsx
import { NavMenu } from "@shopify/app-bridge-react";

export function AppLink({ 
  href, 
  children 
}: { 
  href: string; 
  children: React.ReactNode;
}) {
  return (
    <NavMenu>
      <a href={href}>{children}</a>
    </NavMenu>
  );
}