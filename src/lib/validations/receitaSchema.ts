import { z } from 'zod';

// Definindo as opções válidas para o tipo de receita
const ReceitaTipoEnum = z.enum([
  'venda',
  'servicos', 
  'alugueis', 
  'comissao', 
  'doacao', 
  'outro'
]);

// Define as opções válidas para frequência de recorrência
const FrequenciaEnum = z.enum([
  'diaria',
  'semanal',
  'quinzenal',
  'mensal',
  'bimestral',
  'trimestral',
  'semestral',
  'anual'
]).nullable();

// Define o esquema de validação para o formulário de Receita
export const receitaSchema = z.object({
  id: z.string().uuid().optional(), // Opcional para criação
  descricao: z.string().min(3, { message: "A descrição deve ter pelo menos 3 caracteres." }).max(255, { message: "A descrição não pode exceder 255 caracteres." }),
  valor: z.preprocess(
    (val) => {
      // Remove R$, pontos de milhar e substitui vírgula por ponto
      const cleaned = String(val).replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/, '.');
      // Tenta converter para número, retorna NaN se falhar
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num; // Retorna undefined se não for um número válido
    },
    z.number({ invalid_type_error: "Valor deve ser um número." }).positive({ message: "O valor deve ser positivo." })
  ),
  data: z.string().refine((date) => {
    // Valida se a string está no formato YYYY-MM-DD
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }, { message: "Data inválida." }),
  categoria_id: z.string().uuid({ message: "É necessário selecionar uma categoria para a receita." }),
  forma_pagamento_id: z.string().uuid({ message: "Forma de pagamento inválida." }).nullable().optional(),
  tipo: ReceitaTipoEnum, // Usa o enum atualizado
  observacoes: z.string().max(500, { message: "Observações não podem exceder 500 caracteres." }).optional(),
  comprovante_url: z.string().url({ message: "URL do comprovante inválida." }).optional(),
  created_at: z.string().optional(), // Gerenciado pelo DB
  updated_at: z.string().optional(), // Gerenciado pelo DB
  user_id: z.string().uuid().optional(), // Será preenchido no backend ou hook
  // Campos de recorrência
  recorrente: z.boolean().default(false),
  frequencia: FrequenciaEnum.default(null),
});

// Tipo inferido do schema para uso no frontend
export type ReceitaFormData = z.infer<typeof receitaSchema>; 