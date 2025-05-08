# Documentação: Integração de IA no Gestor Brechó

## Visão Geral

Este documento descreve a integração de funcionalidades de Inteligência Artificial no sistema Gestor Brechó, com foco inicial na funcionalidade de consulta SQL em linguagem natural através de um chatbot.

## Arquitetura

A implementação segue uma arquitetura cliente-servidor:

### Frontend (React)
- **Componentes de UI**: `ChatWidget`, `ChatMessage`, `ChatInput`, `FloatingChatIcon`
- **Gerenciamento de Estado**: `IAContext`, `useIAChat`, `useAuth`
- **Serviços**: `iaService.ts` para comunicação com o backend

### Backend (n8n + Supabase)
- **n8n**: Orquestração de fluxos para processamento de linguagem natural
- **Supabase**: 
  - Tabela `ia_chat_historico` para armazenamento de conversas
  - Função `execute_safe_query` para execução segura de consultas SQL
  - Políticas RLS para garantir segurança dos dados

## Fluxo de Funcionamento

1. O usuário interage com o chatbot através da interface do aplicativo
2. A mensagem é enviada para o backend n8n via `iaService.ts`
3. O n8n processa a mensagem e utiliza um serviço de IA (ex: OpenAI) para:
   - Interpretar a intenção do usuário
   - Converter a linguagem natural em consulta SQL
4. A consulta SQL é validada e executada no Supabase usando `execute_safe_query`
5. O resultado é formatado e retornado para o usuário
6. Todo o histórico é armazenado na tabela `ia_chat_historico`

## Segurança

A implementação prioriza a segurança através de:

- **Autenticação**: Uso do JWT existente em todas as comunicações
- **Autorização**: Políticas RLS no Supabase garantem que usuários acessem apenas seus próprios dados
- **Execução Segura**: Queries SQL são executadas através de uma função SECURITY DEFINER controlada
- **Validação**: Sanitização e validação de inputs do usuário

## Estrutura de Arquivos

```
src/
├── components/
│   └── ia/
│       ├── ChatWidget.tsx       # Componente principal do chat
│       ├── ChatMessage.tsx      # Componente para mensagens individuais
│       ├── ChatInput.tsx        # Input para perguntas do usuário
│       └── FloatingChatIcon.tsx # Ícone flutuante de acesso rápido
├── contexts/
│   └── IAContext.tsx            # Contexto para gerenciar estado do chat
├── hooks/
│   └── useIAChat.ts             # Hook para lógica de chat
└── services/
    └── iaService.ts             # Serviço para comunicação com n8n
```

## Database Schema

### Tabela: ia_chat_historico
```sql
CREATE TABLE ia_chat_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    query_type TEXT,
    processed BOOLEAN DEFAULT false,
    processing_time FLOAT
);
```

## Configuração do n8n

Para completar a implementação do backend, é necessário configurar o n8n com os seguintes fluxos:

1. **Webhook Listener**: Endpoint para receber mensagens do frontend
2. **Autenticação JWT**: Validação do token JWT enviado com cada requisição
3. **Processamento NLP**: Integração com OpenAI para interpretar o texto
4. **Execução de Query**: Chamada para o Supabase executar a consulta gerada
5. **Resposta Formatada**: Retorno dos resultados em formato estruturado

## Próximos Passos

### Fases Futuras de Implementação:
1. **Recomendações baseadas em histórico**: Sugestão de produtos com base no histórico de compras
2. **Alertas preditivos de estoque**: Previsão de quando um produto ficará fora de estoque

### Melhorias Planejadas:
- Cache de consultas frequentes para melhorar performance
- Interface para administradores visualizarem consultas populares
- Expansão do modelo de linguagem para suportar mais tipos de perguntas 