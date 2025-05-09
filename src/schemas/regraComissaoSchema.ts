import { z } from 'zod';

export const regraComissaoSchema = z.object({
  nome: z.string().min(3, { message: "O nome da regra deve ter pelo menos 3 caracteres." }).max(100, { message: "O nome da regra não pode exceder 100 caracteres." }),
  descricao: z.string().max(500, { message: "A descrição não pode exceder 500 caracteres." }).optional().nullable(),
  tipo_calculo: z.enum(['porcentagem', 'valor_fixo'], { required_error: "Selecione o tipo de cálculo." }),
  // Usar preprocess para converter string vazia ou valor para número
  valor: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)), 
    z.number({ required_error: "O valor é obrigatório.", invalid_type_error: "Valor inválido." })
     .positive({ message: "O valor deve ser positivo." })
     // Adicionar validação específica para porcentagem se necessário (ex: <= 100)
     // .refine(val => /* Lógica de validação extra */, { message: "Mensagem de erro" })
  ),
  ativa: z.boolean().default(true),
  // Zod não lida bem com Date nativamente em forms, trataremos as strings e converteremos depois se necessário
  // Ou usar z.date() se o componente DatePicker retornar Date
  periodo_vigencia_inicio: z.date({ coerce: true }).optional().nullable(), // Coerce tenta converter string para Date
  periodo_vigencia_fim: z.date({ coerce: true }).optional().nullable(),
})
.refine(data => {
  // Validação: Se data fim for fornecida, deve ser maior ou igual à data início
  if (data.periodo_vigencia_inicio && data.periodo_vigencia_fim) {
    return data.periodo_vigencia_fim >= data.periodo_vigencia_inicio;
  }
  return true; // Passa se uma ou ambas as datas não forem fornecidas
}, {
  message: "A data de fim da vigência deve ser igual ou posterior à data de início.",
  path: ["periodo_vigencia_fim"], // Associa o erro ao campo data fim
});

// Tipo inferido a partir do schema para usar com react-hook-form
export type RegraComissaoFormData = z.infer<typeof regraComissaoSchema>; 