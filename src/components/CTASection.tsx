import React from 'react';
import { Button } from "@/components/ui/button";

// Componente que renderiza a seção final de Call to Action (Chamada para Ação)
const CTASection = () => {
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
            Junte-se a centenas de lojistas que já simplificaram a administração do seu brechó conosco.
          </p>
          
          {/* Container para os botões de ação (layout flex, adapta para linha em telas pequenas) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Botão primário (fundo branco, texto âmbar para alto contraste no fundo escuro) */}
            <Button className="bg-white text-amber-800 hover:bg-amber-50 text-lg py-4 px-8">
              Começar Agora (14 dias grátis)
            </Button>
            {/* Botão secundário (estilo "outline" adaptado para fundo escuro) */}
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/20 text-lg py-4 px-8">
              Agendar Demonstração
            </Button>
          </div>
          
          {/* Texto de apoio/garantia (cor âmbar clara) */}
          <p className="text-amber-200 mt-8">
            Sem necessidade de cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
