import { z } from 'zod';

// Tipos permitidos para o cálculo da comissão
export const tiposCalculoComissao = [
  'porcentagem',
  'valor_fixo',
  'por_item',
  'por_categoria'
] as const; // 'as const' garante que o tipo seja literal

/**
 * Schema de validação Zod para o formulário de Regra de Comissão.
 */
export const regraComissaoSchema = z.object({
  // Nome da regra: Obrigatório, mínimo 3 caracteres.
  nome: z.string()
    .min(3, { message: 'O nome da regra deve ter pelo menos 3 caracteres.' })
    .max(100, { message: 'O nome não pode exceder 100 caracteres.' }),

  // Tipo de cálculo: Obrigatório, deve ser um dos valores permitidos.
  tipo_calculo: z.enum(tiposCalculoComissao, {
    required_error: "O tipo de cálculo é obrigatório.",
    invalid_type_error: "Selecione um tipo de cálculo válido.",
  }),

  // Valor: Obrigatório, número (será tratado como decimal).
  // Usamos coerce para tentar converter string do input para número.
  valor: z.coerce
    .number({ 
        required_error: "O valor é obrigatório.", 
        invalid_type_error: 'O valor deve ser um número.' 
    })
    .positive({ message: 'O valor da comissão deve ser positivo.' }),

  // Critério de aplicação: Opcional, string (pode ser JSON ou texto livre).
  // Validação mais complexa de JSON pode ser adicionada se necessário.
  criterio_aplicacao: z.string().nullable().optional(),

  // Período de Vigência Início: Data opcional.
  periodo_vigencia_inicio: z.date({ invalid_type_error: 'Data de início inválida.' }).nullable().optional(),

  // Período de Vigência Fim: Data opcional.
  periodo_vigencia_fim: z.date({ invalid_type_error: 'Data de fim inválida.' }).nullable().optional(),

  // Ativa: Booleano, padrão true.
  ativa: z.boolean().default(true),
})
// Validação refinada: Se ambas as datas de vigência forem fornecidas, fim >= início.
.refine((data) => {
    if (data.periodo_vigencia_inicio && data.periodo_vigencia_fim) {
      return data.periodo_vigencia_fim >= data.periodo_vigencia_inicio;
    }
    return true; // Passa se uma ou ambas as datas não forem fornecidas.
  }, {
    message: "A data final de vigência deve ser igual ou posterior à data inicial.",
    path: ["periodo_vigencia_fim"], // Associa o erro ao campo de data final.
});

/**
 * Tipo inferido do schema Zod para uso no formulário TypeScript.
 */
export type RegraComissaoFormData = z.infer<typeof regraComissaoSchema>; 