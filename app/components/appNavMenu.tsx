// components/appNavMenu.tsx main menu for the embedded app

// components/appNavMenu.tsx - Fixed version using Remix navigation
import { Link, useSearchParams, useLocation } from '@remix-run/react';
import { Navigation } from '@shopify/polaris';
import { HomeIcon, ChartCohortIcon, LocationIcon } from '@shopify/polaris-icons';

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

  // Determine which item is currently selected based on pathname
  const getSelectedIndex = () => {
    const pathname = location.pathname;
    if (pathname === '/app' || pathname === '/app/') return 0;
    if (pathname.startsWith('/app/dashboard')) return 1;
    if (pathname.startsWith('/app/portfolios')) return 2;
    if (pathname.startsWith('/app/geolocation')) return 3;
    return 0; // default to home
  };

  const navigationItems = [
    {
      url: buildUrl("/app"),
      label: 'Home',
      icon: HomeIcon,
    },
    {
      url: buildUrl("/app/dashboard"),
      label: 'Dashboard',
      icon: ChartCohortIcon,
    },
    {
      url: buildUrl("/app/portfolios"),
      label: 'Portfolios',
      icon: ChartCohortIcon,
    },
    {
      url: buildUrl("/app/geolocation"),
      label: 'Geo Location',
      icon: LocationIcon,
    },
  ];

  return (
    <div style={{ width: '100%', borderBottom: '1px solid #e1e1e1' }}>
      <Navigation location={location.pathname}>
        <Navigation.Section
          items={navigationItems.map((item, index) => ({
            ...item,
            selected: getSelectedIndex() === index,
          }))}
        />
      </Navigation>
    </div>
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