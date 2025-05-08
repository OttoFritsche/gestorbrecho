import React from 'react';
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Cadastre-se",
    description: "Crie sua conta em menos de 2 minutos e acesse imediatamente o sistema."
  },
  {
    number: "02",
    title: "Configure seu Negócio",
    description: "Personalize categorias, metas e preferências para atender às necessidades específicas do seu negócio."
  },
  {
    number: "03",
    title: "Registre suas Transações",
    description: "Comece a registrar receitas e despesas ou importe dados existentes de outras plataformas."
  },
  {
    number: "04",
    title: "Analise e Planeje",
    description: "Utilize relatórios e projeções para tomar decisões estratégicas e melhorar seu desempenho financeiro."
  }
];

const HowItWorksSection = () => {
  return (
    <div id="how-it-works" className="py-20 bg-rose-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-800 mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-stone-600">
              Comece a transformar a gestão financeira do seu negócio em 4 passos simples
            </p>
          </div>
          
          <div className="space-y-12 relative">
            <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-amber-200 hidden md:block"></div>
            
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="flex flex-col md:flex-row gap-6 items-start relative opacity-0"
                style={{ animation: `fade-in 0.6s ease-out ${index * 0.2}s forwards` }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-lg z-10 relative md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
                  {step.number}
                </div>
                
                <div className={`flex-1 bg-white p-6 rounded-xl border border-amber-100 shadow-sm md:w-5/12 ${index % 2 === 0 ? 'md:ml-[calc(50%+1.5rem)]' : 'md:mr-[calc(50%+1.5rem)]'}`}>
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-stone-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button className="bg-amber-800 hover:bg-amber-700 text-white shadow-lg px-8 py-6 text-lg">
              Começar Agora
            </Button>
            <p className="text-stone-600 mt-4">
              Comece grátis. Sem comprometimento. Cancele quando quiser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;
