import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import ClienteForm from '@/components/clientes/ClienteForm'; // Reutiliza o form
import { fetchClienteById, Cliente } from '@/services/clienteService'; // Importar do serviço
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorDisplay from '@/components/ui/error-display';
import { useToast } from "@/components/ui/use-toast";

const ClienteFormPage: React.FC = () => {
  // Obtém o parâmetro 'id' da URL, se existir (para edição)
  const { id } = useParams<{ id: string }>();
  // Hook para navegação
  const navigate = useNavigate();
  // Cliente do TanStack Query para invalidar cache
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Determina se estamos no modo de edição
  const isEditing = Boolean(id);

  // Busca os dados do cliente se estiver editando
  const { data: cliente, isLoading, error } = useQuery<Cliente | null, Error>({
    // A queryKey inclui o 'id' para buscar um cliente específico
    queryKey: ['cliente', id],
    // A função de busca só é executada se 'id' estiver presente (isEditing)
    queryFn: () => fetchClienteById(id!), // O '!' assume que id existe se isEditing for true
    // Habilita a query apenas se estiver no modo de edição
    enabled: isEditing,
  });

  // Função a ser chamada pelo ClienteForm em caso de sucesso
  const handleSuccess = (updatedCliente?: Cliente) => {
    // Invalida a query da lista de clientes para buscar dados atualizados
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
    // Exibe uma notificação de sucesso
    toast({
      title: `Cliente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`,
      description: `O cliente ${updatedCliente?.nome || ''} foi salvo.`,
    });
    // Navega de volta para a lista de clientes
    navigate('/app/clientes');
  };

  // Tratamento de erro ao buscar cliente para edição
  if (isEditing && error) {
    return <ErrorDisplay message={`Erro ao carregar cliente para edição: ${error.message}`} />;
  }

  // Renderiza o cabeçalho e o formulário
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between pb-4 border-b w-full mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)} 
          aria-label="Voltar"
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-grow text-center px-4">
          <h2 className="text-3xl font-bold font-serif text-[#92400e]">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <p className="text-muted-foreground mt-1">
              {isEditing ? 'Modifique as informações do cliente.' : 'Preencha os dados para cadastrar um novo cliente.'}
          </p>
        </div>
        <div className="w-[40px] flex-shrink-0"></div>
      </div>

      {/* Exibe o spinner enquanto carrega os dados para edição */}
      {isEditing && isLoading && <LoadingSpinner text="Carregando dados do cliente..." />}

      {/* Renderiza o formulário (se não estiver carregando em modo de edição, ou se for cadastro) */}
      {(!isEditing || (isEditing && cliente)) && (
        <ClienteForm 
          // Passa os dados do cliente para o formulário em modo de edição
          cliente={isEditing ? cliente : null} 
          // Passa a função de callback para ser chamada em caso de sucesso
          onSuccess={handleSuccess} 
        />
      )}
    </div>
  );
};

export default ClienteFormPage; 