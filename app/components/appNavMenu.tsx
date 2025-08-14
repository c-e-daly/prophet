// components/appNavMenu.tsx main menu for the embedded app

// components/appNavMenu.tsx main menu for the embedded app

import { NavMenu } from '@shopify/app-bridge-react';
import { Link, useSearchParams, useLocation } from '@remix-run/react';

export default function AppNavMenu() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
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

  // Check if we're on a specific route to add active state
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <NavMenu>
      <Link 
        to={buildUrl("/app")} 
        rel="home"
        preventScrollReset={true}
        replace={false}
      >
        Home
      </Link>
      <Link 
        to={buildUrl("/app/dashboard")}
        preventScrollReset={true}
        replace={false}
      >
        Dashboard
      </Link>
      <Link 
        to={buildUrl("/app/portfolios")}
        preventScrollReset={true}
        replace={false}
      >
        Portfolios
      </Link>
      <Link 
        to={buildUrl("/app/geolocation")}
        preventScrollReset={true}
        replace={false}
      >
        Geo Location
      </Link>
    </NavMenu>
  );
}


/*
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
      <Link to={buildUrl("/app/geolocation")}>Geo Location</Link>
    </NavMenu>
  );
}
  */