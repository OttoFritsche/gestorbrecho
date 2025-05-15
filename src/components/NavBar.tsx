import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import logoIcon from '@/assets/logo/5.png';
import logoText from '@/assets/logo/3.png';

const NavBar = () => {
  return (
    <nav className="bg-rose-50 py-3 w-full">
      <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
          <img src={logoIcon} alt="Ícone Gestor Brechó" className="h-16 w-auto" />
          <img src={logoText} alt="Gestor Brechó" className="h-28 w-auto" />
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-amber-700 hover:text-amber-800 transition-colors font-medium">
            Funcionalidades
          </a>
          <a href="#benefits" className="text-amber-700 hover:text-amber-800 transition-colors font-medium">
            Benefícios
          </a>
          <a href="#how-it-works" className="text-amber-700 hover:text-amber-800 transition-colors font-medium">
            Como Funciona
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" className="text-amber-800 hover:bg-amber-50 font-medium">Acessar Sistema</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
