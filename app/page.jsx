// app/page.jsx or index.jsx
'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const shop = searchParams.get('shop');
    if (shop) {
      // 🔁 Trigger authentication flow by redirecting to Supabase Edge Function
      window.location.href = `https://your-project.supabase.co/functions/v1/authenticate?shop=${shop}`;
    }
  }, []);

  return <p>Loading...</p>;
}
