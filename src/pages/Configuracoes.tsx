import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormasPagamentoGerenciador from '@/components/configuracoes/FormasPagamentoGerenciador';
import AlterarSenhaForm from '@/components/configuracoes/AlterarSenhaForm';
import { Card } from "@/components/ui/card";

const Configuracoes = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="mb-8 pb-4 border-b border-amber-200">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
          Configurações
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Personalize sua experiência, gerencie seus dados e configure as opções do sistema.
        </p>
      </div>

      <div className="bg-amber-50/50 rounded-lg p-6 shadow-sm">
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6 bg-white/80 border border-amber-200">
            <TabsTrigger value="perfil" className="data-[state=active]:bg-amber-100/70 data-[state=active]:text-amber-900">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="formas-pagamento" className="data-[state=active]:bg-amber-100/70 data-[state=active]:text-amber-900">
              Formas de Pagamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="mt-2 transition-all duration-300 ease-in-out">
            <div className="max-w-3xl">
              <h3 className="text-xl font-semibold mb-4 text-amber-800">Perfil de Usuário</h3>
              <p className="text-muted-foreground mb-6">
                Aqui você poderá atualizar suas informações de perfil e alterar sua senha.
              </p>
              
              <div className="border-2 border-amber-300 rounded-lg p-1 shadow-md bg-white">
                <div className="p-2">
                  <AlterarSenhaForm />
                </div>
              </div>
              
              <div className="mt-10 p-4 border border-dashed border-amber-200 rounded-lg bg-amber-50/50">
                <p className="text-sm text-amber-700 italic">
                  Em desenvolvimento: Edição de informações adicionais do perfil (nome, foto, preferências).
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formas-pagamento" className="mt-2 transition-all duration-300 ease-in-out">
            <div className="border-2 border-amber-300 rounded-lg p-6 shadow-md bg-white">
              <FormasPagamentoGerenciador />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Suas configurações são salvas automaticamente e sincronizadas com sua conta.</p>
      </div>
    </div>
  );
};

export default Configuracoes;
