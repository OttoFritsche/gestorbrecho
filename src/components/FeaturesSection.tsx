import React from 'react';
import { PiggyBank, ChartBar, TrendingUp, BellPlus, FileText, Sparkles } from "lucide-react";

const features = [
  {
    icon: <PiggyBank className="h-6 w-6" />,
    title: "Controle Simplificado",
    description: "Registre suas receitas e despesas em segundos e mantenha o controle total sobre o seu fluxo financeiro."
  },
  {
    icon: <ChartBar className="h-6 w-6" />,
    title: "Fluxo de Caixa Visível",
    description: "Acompanhe seu saldo e entenda para onde vai o dinheiro com visualizações claras e intuitivas."
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Relatórios Inteligentes",
    description: "Gere relatórios claros e precisos para tomar decisões informadas sobre o futuro do seu negócio."
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Metas e Projeções",
    description: "Planeje o futuro financeiro do seu negócio com confiança, definindo metas realistas e acompanhando seu progresso."
  },
  {
    icon: <BellPlus className="h-6 w-6" />,
    title: "Alertas Automáticos",
    description: "Nunca mais seja pego de surpresa com alertas inteligentes sobre contas a vencer, metas e saldo baixo."
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Insights e Previsões com IA",
    description: "Receba análises inteligentes, previsões e sugestões personalizadas para otimizar suas vendas e lucros."
  }
];

const FeaturesSection = () => {
  return (
    <div id="features" className="py-20 bg-amber-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-800 mb-4">
            Funcionalidades Principais
          </h2>
          <p className="text-lg text-stone-600 max-w-3xl mx-auto">
            Tudo o que você precisa para gerenciar as finanças do seu negócio em um único lugar
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-amber-100 opacity-0"
              style={{ animation: `fade-in 0.6s ease-out ${index * 0.1}s forwards` }}
            >
              <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                {React.cloneElement(feature.icon, { className: "h-6 w-6 text-amber-800" })}
              </div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-stone-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
