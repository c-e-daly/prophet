import {NavMenu} from '@shopify/app-bridge-react';
import { Link } from 'react-router-dom';

export default function appNavMenu(){
  return(
   <NavMenu>
    <Link to="/home">Home</Link>
     <Link to="/dashbaord">Dashboard</Link>
    <Link to="/home">Portfolios</Link>
 </NavMenu>
  );
}