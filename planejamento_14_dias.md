# Planejamento para Teste de 14 Dias - Gestor Brechó

**Objetivo Principal:** Validar a funcionalidade central do sistema Gestor Brechó com um usuário real (proprietário de brechó) em um ambiente de produção simulado, coletar feedback e identificar bugs ou áreas de melhoria.

**Usuário de Teste:** Proprietária de brechó (esposa do desenvolvedor).

**Duração:** 14 dias.

---

## 1. Preparação para o Deploy (Antes do Início do Teste)

*   **[FEITO] Modificações na Interface Pública/Landing Page:**
    *   Desativar links/botões de cadastro de novos usuários.
    *   Implementar formulário de coleta de interesse (Nome do Brechó, Email, Telefone) salvando no Supabase via Edge Function (`submit-interest`).
        *   Tabela `leads_interessados` criada e ajustada.
        *   Edge Function `submit-interest` criada e ajustada.
    *   Remover seções/CTAs que não se aplicam a um sistema novo (ex: depoimentos, CTAs de "começar grátis" que levavam ao cadastro).
    *   Manter link de Login funcional.
    *   Atualizar seção de benefícios da IA com funcionalidades planejadas.
*   **[PENDENTE] Deploy da Edge Function `submit-interest`:**
    *   Verificar se a última versão da Edge Function (que inclui `nome_brecho` e `telefone`) foi deployada no Supabase.
    *   **Comando:** `npx supabase functions deploy submit-interest`
    *   Ajustar `Access-Control-Allow-Origin` na Edge Function para o domínio de produção ou `*` temporariamente se o domínio de deploy ainda não estiver fixo.
*   **[PENDENTE] Configuração de Variáveis de Ambiente para Deploy:**
    *   Garantir que `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` (a chave anônima `anon`) estejam corretamente configuradas no ambiente de deploy (ex: Lovable).
*   **[PENDENTE] Build de Produção do Frontend:**
    *   Executar o comando de build (ex: `npm run build` ou `bun run build`).
*   **[PENDENTE] Deploy do Frontend:**
    *   Fazer o deploy dos arquivos gerados pelo build para a plataforma de hospedagem (ex: Lovable).

## 2. Durante o Período de Teste (Foco do Usuário e Desenvolvedor)

*   **Para o Usuário de Teste (Esposa):**
    *   Utilizar o sistema para as operações diárias do brechó, cobrindo o máximo de funcionalidades possível:
        *   Cadastro e gestão de produtos.
        *   Registro de vendas (múltiplos itens, diversas formas de pagamento).
        *   Gestão de clientes.
        *   Controle financeiro (lançamento de receitas e despesas).
        *   Interação com o assistente de IA (via n8n) para as funcionalidades disponíveis (saudações, perguntas gerais).
    *   Anotar qualquer dificuldade encontrada, bugs, sugestões de melhoria na usabilidade ou funcionalidades que sentir falta.
    *   Prestar atenção especial à performance e fluidez do sistema.
*   **Para o Desenvolvedor:**
    *   **Monitoramento Ativo (Supabase):**
        *   Acompanhar os logs do Supabase (especialmente erros de API ou banco de dados).
        *   Verificar se os dados inseridos pelo usuário de teste estão corretos nas tabelas.
        *   Observar a tabela `leads_interessados` para ver se algum interessado externo preenche o formulário (embora o foco não seja este agora).
    *   **Monitoramento da IA (n8n e API Externa):**
        *   Acompanhar os logs de execução dos workflows do n8n relacionados à IA.
        *   Monitorar o painel da API de IA externa (ex: OpenAI) para verificar o consumo e eventuais erros. **Objetivo:** Ter uma noção inicial do volume de requests e custos associados a um usuário.
    *   **Coleta de Feedback:**
        *   Manter comunicação constante com o usuário de teste para coletar feedback de forma estruturada (diariamente ou a cada 2-3 dias).
        *   Priorizar a correção de bugs críticos que impeçam o uso do sistema.
    *   **Análise de Performance (Frontend/Backend):**
        *   Observar o tempo de carregamento das páginas e a resposta das interações.
        *   Se houver lentidão, investigar gargalos (consultas ao Supabase, lógica no frontend, etc.).

## 3. Atividades Pós-Teste (Avaliação e Próximos Passos)

*   **Consolidação do Feedback:** Organizar todas as anotações, bugs e sugestões recebidas.
*   **Priorização:** Definir quais bugs são críticos e quais melhorias são mais impactantes para o usuário.
*   **Análise de Custos da IA:** Com base no uso durante o teste, fazer uma projeção inicial de custos da IA por usuário.
*   **Planejamento do Próximo Ciclo de Desenvolvimento:**
    *   Corrigir bugs identificados.
    *   Implementar melhorias de usabilidade prioritárias.
    *   Começar a pensar em funcionalidades administrativas básicas (para o dono do sistema), se o teste validar a viabilidade do produto.
    *   Refinar a estratégia de monetização e controle de custos da IA antes de abrir para mais usuários.

---

**Observações:**

*   Este plano foca em validar o produto com um usuário-chave. Questões como billing, múltiplos assinantes e dashboards administrativos complexos são para fases futuras.
*   A coleta de emails de interessados é um bônus durante este período; o foco principal é o feedback do usuário de teste. 