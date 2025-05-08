import { z } from 'zod';

// Define os possíveis status do produto para validação
const produtoStatus: [string, ...string[]] = ['disponivel', 'reservado', 'vendido', 'inativo'];

// Define o tamanho máximo do arquivo de imagem (ex: 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Define os tipos de imagem aceitos
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Schema de validação Zod para o formulário de produto
export const produtoSchema = z.object({
  // Campo Nome: obrigatório, mínimo 3 caracteres
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),

  // Campo Descrição: opcional
  descricao: z.string().nullable().optional(),

  // Campo Categoria: opcional (UUID válido se fornecido)
  categoria_id: z.string().uuid({ message: "ID de categoria inválido." }).nullable().optional(),

  // Campo SKU: opcional
  sku: z.string().nullable().optional(),

  // Campo Preço de Custo: opcional, número não negativo
  preco_custo: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number({ invalid_type_error: 'Preço de custo deve ser um número.' })
     .min(0, { message: 'Preço de custo não pode ser negativo.' })
     .nullable()
     .optional()
  ),

  // Campo Preço de Venda: obrigatório, número não negativo
  preco_venda: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number({ required_error: 'Preço de venda é obrigatório.', invalid_type_error: 'Preço de venda deve ser um número.' })
     .min(0, { message: 'Preço de venda não pode ser negativo.' })
  ),

  // Campo Quantidade: obrigatório, inteiro não negativo
  quantidade: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number({ required_error: 'Quantidade é obrigatória.', invalid_type_error: 'Quantidade deve ser um número inteiro.' })
     .int({ message: 'Quantidade deve ser um número inteiro.' })
     .min(0, { message: 'Quantidade não pode ser negativa.' })
  ),

  // Campo Status: obrigatório, deve ser um dos valores definidos
  status: z.enum(produtoStatus, {
    required_error: "Status é obrigatório.",
    invalid_type_error: "Selecione um status válido."
  }),

  // Campo Atributos: Agora apenas uma string opcional
  atributos: z.string().nullable().optional(), // Simplificado para aceitar qualquer string ou null/undefined

  // Campo Imagem: opcional, valida tamanho e tipo do arquivo
  imagem: z.instanceof(FileList)
    .optional()
    .nullable()
    .refine(files => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Tamanho máximo da imagem é 5MB.`)
    .refine(files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), "Apenas formatos .jpg, .jpeg, .png e .webp são aceitos."),

  // Campo Imagem URL: opcional (usado na edição para saber se já existe imagem)
  imagem_url: z.string().url({ message: "URL da imagem inválida." }).nullable().optional(),
}); 