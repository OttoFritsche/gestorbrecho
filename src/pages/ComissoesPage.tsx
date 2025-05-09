import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Percent, ListChecks, FileText, Settings, Calculator } from 'lucide-react'; // Ícones relevantes

const ComissoesPage: React.FC = () => {
  const sections = [
    {
      title: "Calcular/Registrar Comissão Manual",
      description: "Calcule e registre comissões manualmente.",
      path: "/app/comissoes/registrar", // Corrigindo a rota para a página existente
      icon: Calculator,
      color: "text-blue-600"
    },
    {
      title: "Regras de Comissão",
      description: "Gerencie as regras de cálculo de comissão.",
      path: "/app/comissoes/regras", // Rota para a nova listagem
      icon: Settings,
      color: "text-purple-600"
    },
    {
      title: "Relatório de Comissões",
      description: "Visualize as comissões geradas e pagas.",
      path: "/app/comissoes/relatorio", // Rota a ser definida
      icon: FileText,
      color: "text-cyan-600"
    },
    // Adicione mais seções conforme necessário (ex: Pagamentos)
  ];

  return (
    <div className="container mx-auto py-8">
      {/* Cabeçalho Padrão */}
      <div className="mb-8 pb-4 border-b text-center">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Gestão de Comissões</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe, calcule e gerencie as comissões dos seus vendedores.
        </p>
      </div>

      {/* Grid para os Cards */}
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

export default ComissoesPage; 