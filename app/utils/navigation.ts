// app/utils/navigation.ts
import { useSearchParams, useNavigate as useRemixNavigate } from "@remix-run/react";
import { useCallback } from "react";

/**
 * Custom hook for consistent in-app navigation
 * Automatically preserves shop and host params across all navigation
 */
export function useAppNavigate() {
  const [searchParams] = useSearchParams();
  const navigate = useRemixNavigate();

  const appNavigate = useCallback(
    (path: string, options?: { replace?: boolean; state?: any }) => {
      const params = new URLSearchParams();
      
      // Always preserve these critical params
      const host = searchParams.get("host");
      const shop = searchParams.get("shop");
      
      if (host) params.set("host", host);
      if (shop) params.set("shop", shop);
      
      // Build final URL
      const finalPath = params.toString() 
        ? `${path}?${params.toString()}` 
        : path;
      
      navigate(finalPath, options);
    },
    [navigate, searchParams]
  );

  return appNavigate;
}

/**
 * Helper to build URLs with preserved params (for Button url prop or Link to prop)
 */
export function useAppUrl() {
  const [searchParams] = useSearchParams();

  return useCallback(
    (path: string) => {
      const params = new URLSearchParams();
      
      const host = searchParams.get("host");
      const shop = searchParams.get("shop");
      
      if (host) params.set("host", host);
      if (shop) params.set("shop", shop);
      
      return params.toString() ? `${path}?${params.toString()}` : path;
    },
    [searchParams]
  );
}

/*

Pattern 1: Button with onClick (Interactive)
import { useAppNavigate } from "../utils/navigation";

export default function MyPage() {
  const navigate = useAppNavigate();

  return (
    <Button onClick={() => navigate('/app/offers/123')}>
      View Offer
    </Button>
  );
}


Pattern 2: Button with url prop (Static)
import { useAppUrl } from "../utils/navigation";

export default function MyPage() {
  const buildUrl = useAppUrl();

  return (
    <Button url={buildUrl('/app/campaigns/new')}>
      Create Campaign
    </Button>
  );
}

Pattern 3: Link (for rows and text links)

import { Link } from "@remix-run/react";
import { useAppUrl } from "../utils/navigation";

export default function MyPage() {
  const buildUrl = useAppUrl();

  return (
    <Link to={buildUrl('/app/campaigns/123')}>
      Campaign Name
    </Link>
  );
}

Pattern 4: IndexTable Row Click
import { useAppNavigate } from "../utils/navigation";

export default function MyPage() {
  const navigate = useAppNavigate();

  const handleRowClick = (id: number) => {
    navigate(`/app/offers/${id}`);
  };

  return (
    <IndexTable.Row onClick={() => handleRowClick(offer.id)}>
      ...
    </IndexTable.Row>
  );
}




*/