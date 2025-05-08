import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Importa supabase
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Importa Card
import { Badge } from "@/components/ui/badge"; // Importa Badge
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"; // Importar Skeleton
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Importar Alert
import { Terminal } from "lucide-react"; // Ícone para Alert
// import HistoricoPontosTable from '@/components/clientes/HistoricoPontosTable'; // Comentado
// import ResgatesTable from '@/components/clientes/ResgatesTable'; // Comentado
// import { toast } from "@/components/ui/use-toast"; // Comentado
// import { useQueryClient } from '@tanstack/react-query'; // Comentado

// Interface simplificada (sem fidelidade)
interface ClienteDetalhes {
  id: string; 
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at: string; 
  ativo: boolean;
  aceita_email: boolean;
  aceita_sms: boolean;
  aceita_whatsapp: boolean;
  observacoes: string | null;
  classificacao: string | null;
  limite_credito: number | null;
  indicado_por: string | null;
  user_id: string | null; 
}

// Interfaces comentadas (não usadas por ora)
/*
interface HistoricoPonto { ... }
interface ResgatePonto { ... }
*/

// Função de busca simplificada
const fetchClienteDetalhesSimples = async (id: string | undefined): Promise<ClienteDetalhes | null> => {
  // 1. Compreensão do Código Existente:
  // A função atual busca um cliente pelo ID no Supabase usando .single().
  // Ela trata o caso de ID indefinido retornando null.
  // Ela tenta tratar erros: se ocorrer um erro *diferente* de 'PGRST116' (nenhuma linha encontrada),
  // ele loga o erro e lança uma exceção.
  // No final, retorna a variável `data`. Se um cliente foi encontrado, `data` contém o objeto ClienteDetalhes.
  // Se nenhum cliente foi encontrado (erro 'PGRST116'), `data` é `null`.
  // A assinatura da função `Promise<ClienteDetalhes | null>` parece correta para esses retornos.

  // 2. Diagnóstico do Problema (Linha `return` sublinhada):
  // O erro `Type '{ error: true; } & String' is missing...` é incomum e sugere que o TypeScript está
  // inferindo um tipo incorreto para a variável `data` no ponto de retorno, ou que o erro real
  // está na forma como o `useQuery` está consumindo essa função (fora da seleção).
  // A lógica atual *parece* correta: se um erro real ocorreu, a função lança uma exceção antes do `return`.
  // Se chegou ao `return data`, `data` deveria ser `ClienteDetalhes` (se encontrado) ou `null` (se não encontrado - PGRST116),
  // ambos compatíveis com `ClienteDetalhes | null`.
  // A causa mais provável, assumindo que o erro está *nesta* função, é uma falha na inferência de tipo
  // após a checagem de erro condicional.

  // 3. Solução Proposta:
  // Vamos reestruturar levemente a lógica de erro para ser mais explícita, tratando o caso 'PGRST116' (não encontrado)
  // separadamente e retornando `null` diretamente nesse caso. Isso pode ajudar o TypeScript a entender melhor
  // os tipos possíveis no ponto de retorno final.

  if (!id) {
    // Se não há ID, não há o que buscar.
    return null;
  }

  // Busca o cliente no Supabase
  const { data, error } = await supabase
    .from('clientes')
    .select(`
      id, nome, telefone, email, endereco, created_at, ativo, 
      aceita_email, aceita_sms, aceita_whatsapp, observacoes, 
      classificacao, limite_credito, indicado_por, user_id
    `)
    .eq('id', id)
    .single(); 

  // Verifica se ocorreu algum erro na consulta
  if (error) {
    // Verifica se o erro é especificamente "nenhuma linha encontrada"
    if (error.code === 'PGRST116') {
      // Isso não é um erro de aplicação, apenas significa que o cliente não existe.
      // Retorna null, conforme a assinatura da função permite.
      return null;
    } else {
      // Qualquer outro erro é um problema real.
      console.error("Erro ao buscar detalhes do cliente no Supabase:", error);
      // Lança uma exceção para ser capturada pelo React Query.
      // Incluir o código do erro pode ajudar na depuração.
      throw new Error(`Erro Supabase: ${error.message} (Code: ${error.code})`);
    }
  }

  // Se não houve erro (error é null), a consulta foi bem-sucedida e encontrou exatamente uma linha.
  // Nesse caso, 'data' conterá o objeto ClienteDetalhes.
  // Adicionamos uma verificação extra por segurança e para ajudar TS.
  if (!data) {
    console.warn("Inconsistência: Nenhum erro, mas 'data' é null após .single().");
    return null;
  }

  // Asserção de tipo em duas etapas como sugerido pelo erro do TS
  return data as unknown as ClienteDetalhes;
};

// Componente para exibir um item da lista de descrição
const DescriptionListItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm text-foreground">{value || '-'}</dd>
  </div>
);

const ClienteDetalhesPage: React.FC = () => {
  const { clienteId } = useParams<{ clienteId: string }>(); 
  // const queryClient = useQueryClient(); // Comentado
  // const [isAddingPoints, setIsAddingPoints] = useState(false); // Removido

  // useQuery com tipo e função de busca simplificados
  const { 
    data: cliente,
    isLoading,
    isError,
    error 
  } = useQuery<ClienteDetalhes | null, Error>({
    queryKey: ['clienteDetalhes', clienteId], 
    queryFn: () => fetchClienteDetalhesSimples(clienteId),
    enabled: !!clienteId, 
  });

  // Helper para formatar datas (exemplo)
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (e) {
      return 'Data inválida';
    }
  }

  // Handler removido
  // const handleAdicionarPontos = async () => { ... };

  // ----- Renderização ----- 

  // Estado de Carregamento com Skeletons
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-8 w-48" /> {/* Botão Voltar Skeleton */}
        <Skeleton className="h-10 w-3/4" /> {/* Título Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-1/2" /> {/* Nome Skeleton */}
              <Skeleton className="h-6 w-16" /> {/* Badge Skeleton */}
            </div>
            <Skeleton className="h-4 w-1/4 mt-1" /> {/* ID Skeleton */}
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {[...Array(9)].map((_, i) => ( // 9 Skeletons para os campos
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de Erro
  if (isError || !clienteId) {
    return (
      <div className="container mx-auto py-10 space-y-6">
         <Button variant="outline" size="sm" asChild>
          <Link to="/app/clientes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Link>
        </Button>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Cliente</AlertTitle>
          <AlertDescription>
            {clienteId ? error?.message || 'Ocorreu um erro desconhecido.' : 'ID do cliente não encontrado na URL.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Estado Cliente Não Encontrado
  if (!cliente) {
     return (
      <div className="container mx-auto py-10 space-y-6">
         <Button variant="outline" size="sm" asChild>
          <Link to="/app/clientes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Link>
        </Button>
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Cliente Não Encontrado</AlertTitle>
          <AlertDescription>
            Não foi possível encontrar um cliente com o ID fornecido.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Estado Cliente Encontrado (Layout Principal)
  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Botão Voltar */}
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/clientes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Clientes
        </Link>
      </Button>

      {/* Título com fonte serifada e cor específica */}
      <h1 className="text-3xl font-bold font-serif text-[#92400e]">Detalhes do Cliente</h1>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start"> {/* items-start para alinhar badge corretamente */}
            {/* Nome com fonte serifada */}
            <CardTitle className="text-2xl font-serif">{cliente.nome}</CardTitle>
            <Badge variant={cliente.ativo ? "default" : "destructive"}>
              {cliente.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <CardDescription>ID: {cliente.id}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Grid para organizar os detalhes */}
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            <DescriptionListItem label="Email" value={cliente.email} />
            <DescriptionListItem label="Telefone" value={cliente.telefone} />
            <DescriptionListItem label="Endereço" value={cliente.endereco} />
            <DescriptionListItem label="Data Cadastro" value={formatDate(cliente.created_at)} />
            <DescriptionListItem label="Classificação" value={cliente.classificacao} />
            <DescriptionListItem 
              label="Limite Crédito" 
              value={cliente.limite_credito?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
            <DescriptionListItem label="Indicado Por" value={cliente.indicado_por} />
            
            {/* Preferências de Contato */}
            <div> 
              <dt className="text-sm font-medium text-muted-foreground">Preferências Contato</dt>
              <dd className="mt-1 text-sm text-foreground space-x-1">
                {cliente.aceita_email || cliente.aceita_sms || cliente.aceita_whatsapp ? (
                  <>
                    {cliente.aceita_email && <Badge variant="secondary">Email</Badge>}
                    {cliente.aceita_sms && <Badge variant="secondary">SMS</Badge>} 
                    {cliente.aceita_whatsapp && <Badge variant="secondary">WhatsApp</Badge>}
                  </>
                ) : (
                  <span>-</span>
                )}
              </dd>
            </div>

            {/* Observações ocupando mais espaço */}
            <div className="md:col-span-2 lg:col-span-3">
              <dt className="text-sm font-medium text-muted-foreground">Observações</dt>
              <dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                {cliente.observacoes || '-'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      {/* TODO: Adicionar seções para Histórico de Pontos e Resgates aqui, 
          talvez usando outros Cards ou Tabs */}

    </div>
  );
};

export default ClienteDetalhesPage; 