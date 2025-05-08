import { z } from 'zod';

// Define o schema de validação para o formulário de Forma de Pagamento
export const formaPagamentoSchema = z.object({
  // Campo 'nome' é obrigatório (string)
  nome: z.string()
    // Define mensagem de erro personalizada se o campo estiver vazio
    .min(1, { message: 'O nome da forma de pagamento é obrigatório.' })
    // Define mensagem de erro personalizada se o nome for muito longo
    .max(50, { message: 'O nome não pode ter mais de 50 caracteres.' }),
});

// Define o tipo TypeScript inferido a partir do schema Zod
export type FormaPagamentoFormData = z.infer<typeof formaPagamentoSchema>; 