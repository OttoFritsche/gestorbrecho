import { z } from 'zod';

// Define o schema de validação para o formulário de despesa usando Zod.
export const despesaSchema = z.object({
  // Descrição da despesa: string não vazia, mínimo 3 caracteres.
  descricao: z.string().min(3, { message: 'A descrição deve ter pelo menos 3 caracteres.' }).max(100, { message: 'A descrição não pode exceder 100 caracteres.' }),
  
  // Valor da despesa: número positivo.
  // Usamos `coerce` para tentar converter string (do input) para número.
  valor: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }).min(0.01, { message: 'O valor deve ser maior que zero.' }),
  
  // ID da categoria: string não vazia (UUID).
  categoria_id: z.string().uuid({ message: 'Selecione uma categoria válida.' }),
  
  // Data da despesa (data de pagamento ou lançamento): objeto Date.
  // O componente DatePicker geralmente trabalha com Date.
  // Tornando opcional aqui, mas a validação refine cuidará da obrigatoriedade se pago=true
  data: z.date().optional().nullable(),
  
  // Status de pagamento: booleano.
  pago: z.boolean().default(false), // Padrão é não pago
  
  // Data de vencimento: objeto Date opcional
  // Tornando opcional para permitir que seja definido via código no onSubmit
  data_vencimento: z.date().optional().nullable(), 
  
  // Forma de pagamento - ID da forma de pagamento, obrigatória se pago=true
  forma_pagamento_id: z.string().uuid({ message: 'Selecione uma forma de pagamento válida.' }).optional().nullable(),

  // Tipo da despesa (Negócio ou Pessoal) - Obrigatório
  tipo_despesa: z.enum(['negocio', 'pessoal'], {
    required_error: "Selecione o tipo da despesa (Negócio ou Pessoal).",
    invalid_type_error: "Tipo de despesa inválido.",
  }),

}).refine(data => {
  // Validação 1: Se estiver marcado como pago, a FORMA DE PAGAMENTO é obrigatória.
  if (data.pago && !data.forma_pagamento_id) {
    return false; // Retorna falso se pago=true e forma_pagamento_id está vazio
  }
  return true; // Passa na validação da forma de pagamento
}, {
  // Mensagem de erro e campo associado para a validação 1
  message: "A forma de pagamento é obrigatória quando a despesa está marcada como paga.",
  path: ["forma_pagamento_id"], // Campo que receberá o erro
}).refine(data => {
  // Validação 2: Se estiver marcado como pago, a DATA DE PAGAMENTO é obrigatória.
  if (data.pago && !data.data) {
    return false; // Retorna falso se pago=true e data (pagamento) está vazio
  }
  return true; // Passa na validação da data de pagamento
}, {
  // Mensagem de erro e campo associado para a validação 2
  message: "A data de pagamento é obrigatória quando a despesa está marcada como paga.",
  path: ["data"], // Campo que receberá o erro
});

// Define o tipo TypeScript inferido a partir do schema Zod.
export type DespesaFormData = z.infer<typeof despesaSchema>; 