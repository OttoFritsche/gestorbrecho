import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CircleDollarSign, TrendingDown, TrendingUp, Target, Scale, LayoutDashboard, FileText } from 'lucide-react'; // Ícones para os cards

const Financeiro: React.FC = () => {
  const sections = [
    { title: "Dashboard", description: "Visão geral financeira", path: "/app/financeiro/dashboard", icon: LayoutDashboard, color: "text-blue-600" },
    { title: "Receitas", description: "Gerencie suas entradas", path: "/app/receitas", icon: TrendingUp, color: "text-green-600" },
    { title: "Despesas", description: "Controle suas saídas", path: "/app/despesas", icon: TrendingDown, color: "text-red-600" },
    { title: "Fluxo de Caixa", description: "Acompanhe o movimento diário", path: "/app/fluxo-caixa", icon: CircleDollarSign, color: "text-cyan-600" },
    { title: "Metas", description: "Defina e siga seus objetivos", path: "/app/metas", icon: Target, color: "text-purple-600" },
    { title: "Balanço", description: "Veja a posição financeira", path: "/app/balanco", icon: Scale, color: "text-indigo-600" },
    { title: "Relatórios", description: "Análises financeiras", path: "/app/relatorios", icon: FileText, color: "text-gray-600" },
  ];

  return (
    <div className="container mx-auto py-8">
      {/* Cabeçalho da Página - Standardized (text-center, mt-1) */}
      <div className="mb-8 pb-4 border-b text-center">
        {/* Título Serifado e com cor específica */}
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Financeiro</h2>
        {/* Added mt-1 to subtitle paragraph */}
        <p className="text-muted-foreground mt-1">
          Gerencie as finanças do seu brechó: receitas, despesas, fluxo de caixa e metas financeiras.
        </p>
      </div>

      {/* Grid para os Cards de Seção */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link to={section.path} key={section.path} className="group block h-full">
            <Card className="h-full transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:border-primary/50 group-hover:-translate-y-1 flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold font-serif flex items-center gap-2">
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
                <section.icon className={`h-6 w-6 ${section.color} flex-shrink-0 ml-4`} />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Financeiro;
