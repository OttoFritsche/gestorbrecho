import { z } from 'zod';

/**
 * Schema de validação para o formulário de vendedores
 * Contém as regras de validação para todos os campos do formulário
 */
export const vendedorSchema = z.object({
  // Nome do vendedor: obrigatório, com pelo menos 3 caracteres
  nome: z.string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' })
    .max(100, { message: 'O nome não pode ter mais de 100 caracteres.' }),
  
  // Email: opcional, mas deve ser válido se fornecido
  email: z.string()
    .email({ message: 'Formato de email inválido.' })
    .nullable()
    .optional(),
  
  // Telefone: opcional
  telefone: z.string()
    .nullable()
    .optional(),
  
  // Data de contratação: opcional, mas deve ser uma data válida se fornecida
  data_contratacao: z.date({
    invalid_type_error: "Formato de data inválido.",
  })
  .nullable()
  .optional(),
  
  // ID do usuário do sistema (opcional, referência para auth.users)
  user_id: z.string()
    .uuid({ message: 'ID de usuário inválido.' })
    .nullable()
    .optional(),
}); 