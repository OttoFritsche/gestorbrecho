
import React from 'react';
import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import ProblemSolutionSection from '@/components/ProblemSolutionSection';
import FeaturesSection from '@/components/FeaturesSection';
import BenefitsSection from '@/components/BenefitsSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import FooterSection from '@/components/FooterSection';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-rose-50">
      <NavBar />
      <main className="space-y-20 py-10">
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <BenefitsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Index;
