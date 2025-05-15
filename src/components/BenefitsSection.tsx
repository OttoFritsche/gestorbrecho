import React from 'react';
// TODO: Importar ícones relevantes para os benefícios da IA quando definidos
// import { BrainCircuit, MessageCircle, TrendingUp, Lightbulb } from "lucide-react"; 
// Importa a imagem conceitual da IA (versão clara para fundo escuro)
import iaConceptImageLight from '@/assets/imagens/ia-brecho-claro.png';
import { MessageSquare, Search, Zap, Lightbulb } from "lucide-react"; // Ícones para os benefícios

// Array contendo os dados dos benefícios a serem exibidos
// Comentado/Removido - Será preenchido com benefícios específicos da IA posteriormente
/*
const benefits = [
  {
    icon: <BrainCircuit className="h-10 w-10 text-amber-800" />, 
    title: "Análises Inteligentes de Vendas", 
    description: "Descubra quais peças vendem mais, quais clientes compram mais e otimize seu estoque com nossa IA."
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-amber-800" />,
    title: "Previsão de Demanda",
    description: "Antecipe tendências e planeje suas compras de forma mais eficaz com base em previsões geradas por IA."
  },
  {
    icon: <Lightbulb className="h-10 w-10 text-amber-800" />,
    title: "Sugestões de Precificação",
    description: "Receba sugestões de preços baseadas em dados históricos e de mercado para maximizar seus lucros."
  },
  {
    icon: <MessageCircle className="h-10 w-10 text-amber-800" />,
    title: "Chatbot Assistente",
    description: "Tire dúvidas sobre o sistema ou peça ajuda para tarefas comuns diretamente ao nosso chatbot inteligente."
  }
];
*/

const iaBenefits = [
  {
    icon: <MessageSquare className="h-8 w-8 text-amber-600" />,
    title: "Converse com Seus Dados",
    description: "Pergunte sobre seu estoque, vendas e finanças em linguagem natural e obtenha respostas rápidas.",
    note: "(Visão futura, com n8n como intermediário inicial)"
  },
  {
    icon: <Search className="h-8 w-8 text-amber-600" />,
    title: "Acompanhamento Inteligente de Vendas",
    description: "Questione \"Qual foi meu total de vendas hoje?\" e receba as informações diretamente do seu assistente.",
    note: "(Visão futura, com n8n como intermediário inicial)"
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-amber-600" />,
    title: "Insights e Sugestões Estratégicas",
    description: "A IA analisará seus dados para oferecer dicas sobre precificação, reposição de estoque e tendências de mercado.",
    note: "(Recurso em desenvolvimento)"
  },
  {
    icon: <Zap className="h-8 w-8 text-amber-600" />,
    title: "Agilidade em Tarefas Rotineiras",
    description: "Deixe que o assistente ajude com lembretes, cadastros rápidos e outras operações do dia a dia.",
    note: "(Capacidade evolutiva)"
  }
];

// Componente que renderiza a seção de benefícios, agora focado em IA
const BenefitsSection = () => {
  return (
    // Container principal da seção
    <div id="benefits" className="py-20 bg-rose-50">
      {/* Container centralizado */}
      <div className="container mx-auto px-4 md:px-6">
        {/* Layout flexível */}
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Coluna da esquerda (Bloco destacado com imagem conceitual de IA) */}
          <div className="w-full md:w-1/2">
            <div className="bg-amber-800 p-8 rounded-2xl shadow-xl relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl blur-md opacity-30"></div>
              <div className="relative">
                {/* Título focado em IA */}
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                  O Futuro da Gestão <span className="text-amber-200">é Inteligente</span>
                </h2>
                {/* Descrição focada em IA e Chatbot */}
                <p className="text-amber-100 text-lg mb-8">
                  O Gestor Brechó integra Inteligência Artificial e um Chatbot assistente para levar a administração do seu negócio a um novo nível de eficiência e insights.
                </p>
                {/* Imagem da IA aplicada (versão clara) */}
                <img src={iaConceptImageLight} 
                     alt="Inteligência Artificial no Gestor Brechó" 
                     className="rounded-lg shadow-lg w-full" />
              </div>
            </div>
          </div>
          
          {/* Coluna da direita (Lista de benefícios específicos da IA) */}
          <div className="w-full md:w-1/2 space-y-8">
            {/* Título da lista de benefícios da IA */}
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-800">
              Benefícios Exclusivos da Nossa IA
            </h2>
            {/* Container para a lista de benefícios (Placeholder) */}
            <div className="space-y-6">
              {iaBenefits.map((benefit, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-amber-800 mb-1">{benefit.title}</h3>
                    <p className="text-stone-600 mb-1">{benefit.description}</p>
                    {benefit.note && <p className="text-xs text-stone-500 italic">{benefit.note}</p>}
                  </div>
                </div>
              ))}
              <p className="mt-4 text-sm text-stone-600">
                Pesquisamos e desenvolvemos continuamente novas capacidades para nossa IA, buscando sempre a melhor experiência e os melhores resultados para o seu brechó!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSection;
