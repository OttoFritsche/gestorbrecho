import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { InterestModalForm } from '@/components/landing/InterestModalForm';
import { ChevronRight } from 'lucide-react';

// Componente que renderiza a seção final de Call to Action (Chamada para Ação)
const CTASection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    // Container principal da seção com espaçamento vertical e fundo gradiente escuro e vibrante
    <div className="py-20 bg-gradient-to-br from-amber-700 to-rose-600">
      {/* Container centralizado com largura máxima e espaçamento horizontal */}
      <div className="container mx-auto px-4 md:px-6">
        {/* Bloco de conteúdo centralizado com largura máxima */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Título principal da CTA (fonte serifada, cor branca para contraste) */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-6">
            Pronto para Transformar a Gestão do Seu Brechó?
          </h2>
          {/* Descrição da CTA (cor âmbar clara para contraste) */}
          <p className="text-xl text-amber-100 mb-10">
            Descubra como nossa plataforma pode simplificar seu dia a dia e impulsionar suas vendas.
          </p>
          
          {/* Container para os botões de ação (layout flex, adapta para linha em telas pequenas) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-white text-amber-800 hover:bg-amber-50 text-lg py-4 px-8 flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              Tenho Interesse
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Texto de apoio/garantia (cor âmbar clara) */}
          <p className="text-amber-200 mt-8">
            Deixe seu contato e retornaremos em breve!
          </p>
        </div>
      </div>
      <InterestModalForm 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Quer Transformar seu Brechó?"
        description="Excelente! Preencha os dados abaixo e nossa equipe entrará em contato."
      />
    </div>
  );
};

export default CTASection;
