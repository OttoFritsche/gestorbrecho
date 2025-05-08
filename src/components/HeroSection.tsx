import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
const HeroSection = () => {
  return <div className="bg-gradient-to-br from-rose-50 to-amber-50 py-16 md:py-24 -mt-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="w-full md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-amber-800 leading-tight opacity-0 animate-fade-in">
              Simplifique a Gestão do seu Brechó com <span className="text-amber-600">Inteligência Artificial Integrada</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 opacity-0 animate-fade-in-delay-1">
              A plataforma completa para administrar estoque, vendas, fornecedores e finanças do seu brechó de forma simples e organizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 opacity-0 animate-fade-in-delay-2">
              <Button className="bg-amber-800 hover:bg-amber-700 text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Comece Agora (14 dias grátis)
              </Button>
              <Button variant="outline" className="border-amber-800 text-amber-800 hover:bg-amber-50">
                Solicitar Demonstração
              </Button>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 opacity-0 animate-fade-in-delay-1">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl blur-md opacity-30"></div>
              <div className="relative bg-white p-2 rounded-xl shadow-xl">
                <img alt="Dashboard Gestor Brechó" className="rounded-lg w-full h-auto shadow-sm" src="/lovable-uploads/ad4cc10a-5c59-48c9-8dc5-0f0a82f1d619.jpg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default HeroSection;
