// components/appNavMenu.tsx main menu for the embedded app
import { NavMenu } from '@shopify/app-bridge-react';
import { Link, useSearchParams } from '@remix-run/react';

export default function AppNavMenu() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  const host = searchParams.get("host");
  
  
  // Helper function to build URLs with preserved parameters
  const buildUrl = (path: string) => {
    const params = new URLSearchParams();
    if (shop) params.set("shop", shop);
    if (host) params.set("host", host);
    
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  return (
    <NavMenu>
      <Link to={buildUrl("/app")} rel="home">Home</Link>
      <Link to={buildUrl("/app/dashboard")}>Dashboard</Link>
      <Link to={buildUrl("/app/portfolios")}>Portfolios</Link>
      <Link to={buildUrl("/app/geolocation")}>Geolocation</Link>
    </NavMenu>
  );
}
