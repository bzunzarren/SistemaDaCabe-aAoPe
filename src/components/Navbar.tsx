import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Users, BarChart2, ShoppingCart, DollarSign } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-playfair text-2xl text-[#8B7355]">
            Da Cabeça ao Pé
          </Link>
          
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-2 ${
                isActive('/') ? 'text-[#8B7355]' : 'text-[#4A3E3E]'
              } hover:text-[#8B7355] transition-colors`}
            >
              <BarChart2 size={20} />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/products"
              className={`flex items-center space-x-2 ${
                isActive('/products') ? 'text-[#8B7355]' : 'text-[#4A3E3E]'
              } hover:text-[#8B7355] transition-colors`}
            >
              <ShoppingBag size={20} />
              <span>Produtos</span>
            </Link>
            
            <Link
              to="/customers"
              className={`flex items-center space-x-2 ${
                isActive('/customers') ? 'text-[#8B7355]' : 'text-[#4A3E3E]'
              } hover:text-[#8B7355] transition-colors`}
            >
              <Users size={20} />
              <span>Clientes</span>
            </Link>

            <Link
              to="/brandregistration"
              className={`flex items-center space-x-2 ${
                isActive('/brandregistration') ? 'text-[#8B7355]' : 'text-[#4A3E3E]'
              } hover:text-[#8B7355] transition-colors`}
            >
              <ShoppingBag size={20} />
              <span>Marcas</span>
            </Link>
            
            <Link
              to="/pos"
              className={`flex items-center space-x-2 ${
                isActive('/pos') ? 'text-[#8B7355]' : 'text-[#4A3E3E]'
              } hover:text-[#8B7355] transition-colors`}
            >
              <ShoppingCart size={20} />
              <span>PDV</span>
            </Link>

            <Link
              to="/financial"
              className={`flex items-center space-x-2 ${
                isActive('/financial') ? 'text-[#8B7355]' : 'text-[#4A3E3E]'
              } hover:text-[#8B7355] transition-colors`}
            >
              <DollarSign size={20} />
              <span>Financeiro</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;