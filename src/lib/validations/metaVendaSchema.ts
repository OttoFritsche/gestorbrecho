import { z } from 'zod';

/**
 * Schema de validação Zod para o formulário de Meta de Venda.
 */
export const metaVendaSchema = z.object({
  // ID do vendedor: Obrigatório
  vendedor_id: z.string({
    required_error: "O vendedor é obrigatório.",
    invalid_type_error: "Selecione um vendedor válido."
  }),

  // Período Início: Data obrigatória
  periodo_inicio: z.date({
    required_error: "A data de início é obrigatória.",
    invalid_type_error: "Data de início inválida."
  }),

  // Período Fim: Data obrigatória
  periodo_fim: z.date({
    required_error: "A data de fim é obrigatória.",
    invalid_type_error: "Data de fim inválida."
  }),

  // Meta de Valor: Número opcional
  meta_valor: z.coerce
    .number({ invalid_type_error: "O valor deve ser um número." })
    .nonnegative({ message: "O valor não pode ser negativo." })
    .nullable()
    .optional(),

  // Meta de Quantidade: Número inteiro opcional
  meta_quantidade: z.coerce
    .number({ invalid_type_error: "A quantidade deve ser um número." })
    .int({ message: "A quantidade deve ser um número inteiro." })
    .nonnegative({ message: "A quantidade não pode ser negativa." })
    .nullable()
    .optional(),

  // Observações: String opcional
  observacoes: z.string().nullable().optional(),
})
// Validação refinada: período_fim >= período_inicio
.refine((data) => {
  return data.periodo_fim >= data.periodo_inicio;
}, {
  message: "A data final deve ser igual ou posterior à data inicial.",
  path: ["periodo_fim"]
})
// Validação refinada: pelo menos um dos campos meta_valor ou meta_quantidade deve ser preenchido
.refine((data) => {
  return data.meta_valor != null || data.meta_quantidade != null;
}, {
  message: "Pelo menos uma meta (valor ou quantidade) deve ser definida.",
  path: ["meta_valor"]
});

/**
 * Tipo inferido do schema Zod para uso no formulário TypeScript.
 */
export type MetaVendaFormData = z.infer<typeof metaVendaSchema>; 