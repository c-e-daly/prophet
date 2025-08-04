import { NavMenu } from '@shopify/app-bridge-react';
import { Link } from '@remix-run/react'; // Use Remix Link, not react-router-dom

export default function AppNavMenu() {
  return (
    <NavMenu>
      <Link to="/app" rel="home">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/portfolios">Portfolios</Link>
    </NavMenu>
  );
}