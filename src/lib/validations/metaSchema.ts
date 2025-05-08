import { z } from 'zod';

// Define o esquema de validação para o formulário de Meta
export const metaSchema = z.object({
  // Nome (título) é obrigatório
  nome: z.string().min(3, { message: "Nome da meta deve ter pelo menos 3 caracteres." }),
  // Descrição é opcional
  descricao: z.string().nullable().optional(),
  // Tipo é obrigatório e deve ser um dos valores permitidos (incluindo 'economia')
  tipo: z.enum(['receita', 'despesa', 'venda', 'lucro', 'outros', 'economia'], {
    required_error: "Tipo da meta é obrigatório.",
    invalid_type_error: "Selecione um tipo válido.",
  }),
  // Período é obrigatório
  periodo: z.enum(['diario', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual', 'unico'], {
    required_error: "Período de apuração é obrigatório.",
    invalid_type_error: "Selecione um período válido.",
  }),
  // Valor da meta é obrigatório e deve ser positivo
  valor_meta: z.coerce
    .number({ invalid_type_error: "Valor da meta deve ser um número." })
    .positive({ message: "Valor da meta deve ser maior que zero." }),
  // Data de início é obrigatória
  data_inicio: z.date({
    required_error: "Data de início é obrigatória.",
    invalid_type_error: "Formato de data inválido.",
  }),
  // Data de fim é obrigatória
  data_fim: z.date({
    required_error: "Data de fim é obrigatória.",
    invalid_type_error: "Formato de data inválido.",
  }),
  // Observações são opcionais
  observacoes: z.string().nullable().optional(),
  // Categoria ID é opcional (UUID)
  categoria_id: z.string().uuid({ message: "Categoria inválida." }).nullable().optional(),
  // Profile ID é opcional (UUID)
  profile_id: z.string().uuid({ message: "Perfil inválido." }).nullable().optional(),
}).refine((data) => data.data_fim >= data.data_inicio, {
  // Validação customizada para garantir data_fim >= data_inicio
  message: "Data final deve ser igual ou posterior à data inicial.",
  path: ["data_fim"], // Associa o erro ao campo data_fim
});

// Tipo inferido para uso no formulário
export type MetaFormData = z.infer<typeof metaSchema>;

// Esquema para adicionar progresso (mais simples)
export const progressoMetaSchema = z.object({
  valor: z.coerce
    .number({ invalid_type_error: "Valor deve ser um número." })
    .nonnegative({ message: "Valor deve ser zero ou maior." }), // Progresso pode ser zero
  data: z.date().optional().default(new Date()), // Data opcional, padrão hoje
  observacao: z.string().nullable().optional(),
});

export type ProgressoMetaFormData = z.infer<typeof progressoMetaSchema>; 