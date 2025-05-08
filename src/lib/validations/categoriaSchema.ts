// src/lib/validations/categoriaSchema.ts
import { z } from 'zod';
import { categoriaTipos } from '../types/categoria';

// Regex para validar formato hexadecimal de cor (#RRGGBB ou #RGB)
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Esquema de validação para o formulário de criação e edição de Categorias.
 */
export const categoriaSchema = z.object({
  // Nome da categoria: texto, obrigatório, mínimo 3 caracteres, máximo 100
  nome: z.string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres." })
    .max(100, { message: "O nome não pode ter mais de 100 caracteres." })
    .trim(), // Remove espaços em branco extras

  // Tipo da categoria: deve ser um dos tipos válidos definidos em categoriaTipos
  tipo: z.enum(categoriaTipos, {
    errorMap: () => ({ message: "Selecione um tipo válido para a categoria." })
  }),

  // Descrição da categoria: texto, opcional, máximo 500 caracteres
  descricao: z.string()
    .max(500, { message: "A descrição não pode ter mais de 500 caracteres." })
    .optional() // Torna o campo opcional
    .or(z.literal('')) // Permite string vazia
    .nullable(), // Permite null

  // Cor da categoria: texto, opcional, deve ser um código hexadecimal válido
  cor: z.string()
    .regex(hexColorRegex, { message: "Formato de cor inválido. Use #RRGGBB ou #RGB." })
    .optional()
    .or(z.literal('')) // Permite string vazia
    .nullable(), // Permite null
});

/**
 * Tipo inferido do esquema Zod para uso no TypeScript.
 * Representa os dados validados do formulário.
 */
export type CategoriaFormData = z.infer<typeof categoriaSchema>; 