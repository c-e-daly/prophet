// app/components/FlashBanner.tsx
import { Banner } from "@shopify/polaris";
import { useEffect, useState } from "react";
import type { FlashMessage } from "../utils/flash.server";  

type Props = {
  flash: FlashMessage | null;
};

export function FlashBanner({ flash }: Props) {
  const [visible, setVisible] = useState(!!flash);

  useEffect(() => {
    if (flash) {
      setVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  if (!flash || !visible) return null;

  // Map flash types to Polaris Banner tones
  const tone: "success" | "critical" | "info" | "warning" = 
    flash.type === "error" ? "critical" : flash.type;

  return (
    <div style={{ marginBottom: "var(--p-space-400)" }}>
      <Banner
        tone={tone}
        onDismiss={() => setVisible(false)}
      >
        {flash.message}
      </Banner>
    </div>
  );
}