import { NavMenu } from '@shopify/app-bridge-react';
import { Link } from '@remix-run/react'; // Use Remix Link, not react-router-dom

export default function AppNavMenu() {
  return (
    <NavMenu>
      <Link to="/app" rel="home">Home</Link>
      <Link to="/app/dashboard">Dashboard</Link>
      <Link to="/app/portfolios">Portfolios</Link>
    </NavMenu>
  );
}