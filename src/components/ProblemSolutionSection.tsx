import React from 'react';
import { Button } from "@/components/ui/button";
import { Boxes, ClipboardCheck, Users, UsersRound, Tag, Sparkles, Calculator, BarChart } from "lucide-react";

const ProblemSolutionSection = () => {
  const items = [
    {
      problem: "Dificuldade em controlar entrada e saída de peças",
      problemIcon: Boxes,
      solution: "Controle completo de estoque e etiquetagem",
      solutionIcon: ClipboardCheck,
    },
    {
      problem: "Confusão entre fornecedores e compradores",
      problemIcon: Users,
      solution: "Gestão de fornecedores e compradores separadamente",
      solutionIcon: UsersRound,
    },
    {
      problem: "Perda de tempo com etiquetas e preços manuais",
      problemIcon: Tag,
      solution: "Precificação automática e controle de margens",
      solutionIcon: Sparkles,
    },
    {
      problem: "Dificuldade em calcular lucros e comissões",
      problemIcon: Calculator,
      solution: "Relatórios claros de vendas e comissões",
      solutionIcon: BarChart,
    },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-800 mb-4">
            Chega de Planilhas e Controles Manuais Desorganizados
          </h2>
          <p className="text-lg text-stone-600">
            Transforme a gestão do seu brechó com ferramentas intuitivas e inteligentes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-stone-700 mb-4 text-center md:text-left">Os Problemas Comuns</h3>
            {items.map((item, index) => (
              <div key={`problem-${index}`} className="flex items-start gap-4 p-4 bg-rose-50 rounded-lg border border-rose-100 opacity-0 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                <item.problemIcon className="h-6 w-6 text-stone-500 flex-shrink-0 mt-1" />
                <p className="text-stone-700">{item.problem}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-amber-800 mb-4 text-center md:text-left">A Solução Gestor Brechó</h3>
            {items.map((item, index) => (
              <div key={`solution-${index}`} className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100 opacity-0 animate-fade-in" style={{animationDelay: `${(index * 0.1) + 0.4}s`}}>
                <item.solutionIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <p className="text-stone-700 font-medium">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12 md:mt-16">
          <Button className="bg-amber-800 hover:bg-amber-700 text-white opacity-0 animate-fade-in-delay-2">
            Conheça a Solução Completa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProblemSolutionSection;
