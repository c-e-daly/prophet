import { NavMenu } from '@shopify/app-bridge-react';
import { Link } from 'react-router-dom';

export default function appMenu(){
  return(
   <NavMenu>
    <Link to="/app" rel="home">Home</Link>
     <Link to="/app/dashboard">Dashboard</Link>
    <Link to="/app/portfolios">Portfolios</Link>
 </NavMenu>
  );
}