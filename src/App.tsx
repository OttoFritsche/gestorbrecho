import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/layout/AppLayout";
import Financeiro from "./pages/Financeiro";
import Vendas from "./pages/Vendas";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import Categorias from "./pages/Categorias";
import NovaCategoria from "./pages/NovaCategoria";
import EditarCategoria from "./pages/EditarCategoria";
import Configuracoes from "./pages/Configuracoes";
import LoginPage from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SignupPage from './pages/Signup';
import ReceitasPage from '@/pages/app/Receitas';
import ReceitaFormPage from '@/pages/app/financeiro/ReceitaFormPage';
import ReceitaRecorrentePage from '@/pages/app/financeiro/ReceitaRecorrentePage';
import ClientesPage from '@/pages/Clientes';
import ClienteDetalhesPage from '@/pages/app/ClienteDetalhesPage';
import { RegistrarVendaPage } from "@/pages/app/vendas/RegistrarVendaPage";
import VendaDetalhesPage from "@/pages/app/vendas/VendaDetalhesPage";
import DespesasPage from "@/pages/Despesas";
import FluxoCaixaPage from "@/pages/FluxoCaixa";
import MetasPage from "@/pages/Metas";
import MetaDetalhesPage from "@/pages/MetaDetalhes";
import NovaMetaPage from "@/pages/NovaMetaPage";
import EditarMetaPage from "@/pages/EditarMetaPage";
import BalancoPatrimonialPage from "@/pages/BalancoPatrimonial";
import DashboardFinanceiroPage from '@/pages/app/financeiro/DashboardFinanceiro';
import DespesaFormPage from '@/pages/app/financeiro/DespesaFormPage';
import DespesaRecorrentePage from '@/pages/app/financeiro/DespesaRecorentePage';
import RelatoriosIndex from '@/pages/RelatoriosIndex';
import ResumoFinanceiroPage from '@/pages/relatorios/ResumoFinanceiro';
import DespesasPorCategoriaPage from '@/pages/relatorios/DespesasPorCategoria';
import ReceitasPorCategoriaPage from '@/pages/relatorios/ReceitasPorCategoria';
import LucratividadeMensalPage from '@/pages/relatorios/LucratividadeMensal';
import ComparativoMensalPage from '@/pages/relatorios/ComparativoMensal';
import ProdutoFormPage from './pages/ProdutoFormPage';
import ClienteFormPage from './pages/ClienteFormPage';
import VendaFormPage from '@/pages/VendaFormPage';
// Importação das páginas de fornecedores
import FornecedoresPage from './pages/app/fornecedores';
import NovoFornecedorPage from './pages/app/fornecedores/novo';
import EditarFornecedorPage from './pages/app/fornecedores/[id]/editar';
import DetalheFornecedorPage from './pages/app/fornecedores/[id]/index';
// Importação dos componentes de IA
import { IAProvider, useIA } from './contexts/IAContext';
import FloatingChatIcon from './components/ia/FloatingChatIcon';
import ChatWidget from './components/ia/ChatWidget';
// Importação da página do assistente
import AssistentePage from './pages/app/assistente/AssistentePage';
// Importação do ChatbotPage alternativo
import ChatbotPage from './pages/ia/ChatbotPage';
// Importação do processador de receitas recorrentes
import { processarReceitasRecorrentes } from './services/receitasRecorrentes';
// Importação dos componentes de Vendedores
import VendedoresPage from "./pages/app/vendedores";
import NovoVendedor from "./pages/app/vendedores/novo";
// Importação da página de relatório de comissões
import RelatorioComissoesPage from "@/pages/app/comissoes/relatorio";
import RegistrarComissaoPage from '@/pages/app/comissoes/registrar';
// Importação das novas páginas de comissões
import ComissoesPage from '@/pages/ComissoesPage';
import RegrasComissaoPage from '@/pages/RegrasComissaoPage';
import RegraComissaoFormPage from '@/pages/RegraComissaoFormPage';
// Adicionar importação do WelcomeModal
import { WelcomeModal } from '@/components/auth/WelcomeModal';

const queryClient = new QueryClient();

// Componente que renderiza os componentes de IA apenas para rotas protegidas
const IAComponents = () => {
  const { isChatOpen, toggleChat, messages, isLoading, sendMessage } = useIA();
  
  return (
    <>
      <FloatingChatIcon onClick={toggleChat} unreadCount={0} />
      <ChatWidget 
        isOpen={isChatOpen} 
        onClose={toggleChat} 
        initialMessages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Corrigido para usar o hook importado

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string; onboarding_concluido: boolean } | null>(null);

  useEffect(() => {
    // Processa as receitas recorrentes ao iniciar o app (apenas uma vez)
    // Espera 2 segundos para não impactar a inicialização inicial
    const timer = setTimeout(() => {
      processarReceitasRecorrentes().catch(console.error);
    }, 2000);

    // Listener para mudanças no estado de autenticação
    const checkAuthAndOnboarding = async (session: any) => { // session pode ser null
      // console.log("Onboarding Check: Auth state changed. Session:", session);

      if (session && session.user) {
        // console.log("Onboarding Check: User ID:", session.user.id);

        // Buscar perfil do usuário
        const supabaseClient = await import('@/integrations/supabase/client').then(m => m.supabase);
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('id, onboarding_concluido')
          .eq('id', session.user.id)
          .single();

        // console.log("Onboarding Check: Profile data:", profile);
        // console.log("Onboarding Check: Profile error:", profileError);

        if (profileError) {
          console.error("Onboarding Check: Error fetching profile:", profileError);
          setUserProfile(null); // Limpa o perfil em caso de erro
          setIsWelcomeModalOpen(false); // Garante que o modal não abra
          return;
        }

        if (profile) {
          setUserProfile(profile);
          // Verificar se o onboarding já foi concluído
          if (!profile.onboarding_concluido) {
            // console.log("Onboarding Check: Onboarding NOT completed. Opening modal.");
            setIsWelcomeModalOpen(true);
          } else {
            // console.log("Onboarding Check: Onboarding already completed.");
            setIsWelcomeModalOpen(false);
          }
        } else {
          // Isso pode acontecer se o perfil ainda não foi criado, embora o usuário exista no auth.users
          // Ou se houver algum problema com RLS impedindo a leitura.
          console.warn("Onboarding Check: Profile not found for user ID:", session.user.id);
          setUserProfile(null);
          setIsWelcomeModalOpen(false);
        }
      } else {
        // console.log("Onboarding Check: No active session or user.");
        setUserProfile(null); // Limpa o perfil se não houver sessão
        setIsWelcomeModalOpen(false); // Fecha o modal se não houver sessão
      }
    };

    // Imediatamente verifica a sessão atual ao carregar
    import('@/integrations/supabase/client').then(async m => {
      const { data: { session } } = await m.supabase.auth.getSession();
      checkAuthAndOnboarding(session); // Chama a função com a sessão atual

      // Configura o listener para futuras mudanças
      const { data: authListener } = m.supabase.auth.onAuthStateChange((_event, session) => {
        checkAuthAndOnboarding(session);
      });
      
      // Limpeza do listener e do timer quando o componente for desmontado
      return () => {
        if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
          // console.log("Onboarding Check: Auth listener unsubscribed.");
        }
        clearTimeout(timer);
      };
    });

  }, []); // O array de dependências vazio está correto aqui, pois o onAuthStateChange gerencia as atualizações

  const handleCloseWelcomeModal = async () => {
    setIsWelcomeModalOpen(false);
    if (userProfile && userProfile.id) {
      // console.log("Onboarding Check: Closing modal and updating onboarding_concluido for user ID:", userProfile.id);
      const supabaseClient = await import('@/integrations/supabase/client').then(m => m.supabase);
      const { error } = await supabaseClient
        .from('profiles')
        .update({ onboarding_concluido: true })
        .eq('id', userProfile.id);

      if (error) {
        console.error("Onboarding Check: Error updating onboarding_concluido:", error);
      } else {
        // console.log("Onboarding Check: onboarding_concluido updated successfully.");
        // Atualizar o estado local do perfil para refletir a mudança
        setUserProfile(prev => prev ? { ...prev, onboarding_concluido: true } : null);
      }
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <IAProvider>
              <AppLayout />
            </IAProvider>
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="receitas" element={<ReceitasPage />} />
          <Route path="receitas/nova" element={<ReceitaFormPage />} />
          <Route path="receitas/recorrente" element={<ReceitaRecorrentePage />} />
          <Route path="receitas/:id/editar" element={<ReceitaFormPage />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="financeiro/dashboard" element={<DashboardFinanceiroPage />} />
          <Route path="despesas" element={<DespesasPage />} />
          <Route path="despesas/nova" element={<DespesaFormPage />} />
          <Route path="despesas/recorrente" element={<DespesaRecorrentePage />} />
          <Route path="despesas/:id/editar" element={<DespesaFormPage />} />
          <Route path="fluxo-caixa" element={<FluxoCaixaPage />} />
          <Route path="metas" element={<MetasPage />} />
          <Route path="metas/:metaId" element={<MetaDetalhesPage />} />
          <Route path="metas/nova" element={<NovaMetaPage />} />
          <Route path="metas/:metaId/editar" element={<EditarMetaPage />} />
          <Route path="balanco" element={<BalancoPatrimonialPage />} />
          <Route path="relatorios" element={<RelatoriosIndex />} />
          <Route path="relatorios/resumo" element={<ResumoFinanceiroPage />} />
          <Route path="relatorios/despesas-categoria" element={<DespesasPorCategoriaPage />} />
          <Route path="relatorios/receitas-categoria" element={<ReceitasPorCategoriaPage />} />
          <Route path="relatorios/lucratividade-mensal" element={<LucratividadeMensalPage />} />
          <Route path="relatorios/comparativo-mensal" element={<ComparativoMensalPage />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="vendas/nova" element={<VendaFormPage />} />
          <Route path="vendas/:id/editar" element={<VendaFormPage />} />
          <Route path="vendas/:saleId" element={<VendaDetalhesPage />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="estoque/novo" element={<ProdutoFormPage />} />
          <Route path="estoque/:id/editar" element={<ProdutoFormPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/:clienteId" element={<ClienteDetalhesPage />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="categorias/nova" element={<NovaCategoria />} />
          <Route path="categorias/:id/editar" element={<EditarCategoria />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="clientes/novo" element={<ClienteFormPage />} />
          <Route path="clientes/:id/editar" element={<ClienteFormPage />} />
          <Route path="assistente" element={<AssistentePage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          {/* Rotas de fornecedores */}
          <Route path="fornecedores" element={<FornecedoresPage />} />
          <Route path="fornecedores/novo" element={<NovoFornecedorPage />} />
          <Route path="fornecedores/:id" element={<DetalheFornecedorPage />} />
          <Route path="fornecedores/:id/editar" element={<EditarFornecedorPage />} />
          
          {/* Rotas de vendedores */}
          <Route path="vendedores" element={<VendedoresPage />} />
          <Route path="vendedores/novo" element={<NovoVendedor />} />
          <Route path="vendedores/:id/editar" element={<NovoVendedor />} />
          
          {/* Rotas de comissões */}
          <Route path="comissoes" element={<ComissoesPage />} />
          <Route path="comissoes/regras" element={<RegrasComissaoPage />} />
          <Route path="comissoes/regras/nova" element={<RegraComissaoFormPage />} />
          <Route path="comissoes/regras/:id/editar" element={<RegraComissaoFormPage />} />
          <Route path="comissoes/relatorio" element={<RelatorioComissoesPage />} />
          <Route path="comissoes/registrar" element={<RegistrarComissaoPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <WelcomeModal isOpen={isWelcomeModalOpen} onClose={handleCloseWelcomeModal} />
    </>
  );
};

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
      <Toaster />
      <Sonner />
    </HelmetProvider>
  );
}

export default App;
