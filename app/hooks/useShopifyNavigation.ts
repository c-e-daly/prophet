// app/hooks/useShopifyNavigation.ts
import { useNavigation } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";

export function useShopifyNavigation() {
  const navigation = useNavigation();
  const app = useAppBridge();

  useEffect(() => {
    app.loading(navigation.state === "loading");
  }, [navigation.state, app]);

  return {
    isLoading: navigation.state === "loading",
    isSubmitting: navigation.state === "submitting",
    isIdle: navigation.state === "idle"
  };
}