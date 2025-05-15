import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import ProblemSolutionSection from '@/components/ProblemSolutionSection';
import FeaturesSection from '@/components/FeaturesSection';
import BenefitsSection from '@/components/BenefitsSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import CTASection from '@/components/CTASection';
import FooterSection from '@/components/FooterSection';

const Index = () => {
  useEffect(() => {
    const signOutUser = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error.message);
        // Opcional: Adicionar um toast aqui para notificar o usuário sobre o erro no logout
      } else {
        // Opcional: Adicionar um toast aqui para notificar que o usuário foi deslogado (pode ser desnecessário)
        // console.log('Usuário deslogado ao acessar a landing page.');
      }
    };

    signOutUser();
  }, []); // Array de dependências vazio para executar apenas na montagem

  return (
    <div className="min-h-screen flex flex-col bg-rose-50">
      <NavBar />
      <main className="space-y-20 py-10">
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <BenefitsSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Index;
