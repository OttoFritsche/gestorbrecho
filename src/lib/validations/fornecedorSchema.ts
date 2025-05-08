import { z } from 'zod';
import { isValidCPF, isValidCNPJ } from '../utils';

// Regex para validação de telefone brasileiro
const telefoneRegex = /^(\(\d{2}\)\s*|(\d{2}))?\d{4,5}[-\s]?\d{4}$/;

// Regex para validação de CEP
const cepRegex = /^\d{5}-?\d{3}$/;

// Validador personalizado para CNPJ/CPF
const cnpjCpfValidator = z.string().optional().refine(
  (value) => {
    if (!value) return true; // Aceita vazio
    const numericValue = value.replace(/[^\d]/g, '');
    return isValidCPF(numericValue) || isValidCNPJ(numericValue);
  },
  {
    message: "CNPJ/CPF inválido",
  }
);

// Definição do schema do fornecedor
export const fornecedorSchema = z.object({
  // ID é gerado pelo DB, UUID
  id: z.string().uuid().optional(),
  
  // user_id é gerenciado internamente/RLS
  user_id: z.string().uuid().optional(),
  
  // Nome/Razão Social é obrigatório
  nome_razao_social: z
    .string()
    .min(3, 'Nome/Razão Social deve ter pelo menos 3 caracteres.'),
  
  // Nome Fantasia é opcional
  nome_fantasia: z.string().optional(),
  
  // CNPJ/CPF com validação personalizada
  cnpj_cpf: cnpjCpfValidator,
  
  // IE/RG opcional
  ie_rg: z.string().optional(),
  
  // Contato principal opcional
  contato_principal: z.string().optional(),
  
  // Telefone opcional, com validação de formato
  telefone: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true; // Aceita vazio
        return telefoneRegex.test(value);
      },
      {
        message: "Formato de telefone inválido. Use (XX) XXXXX-XXXX ou similar.",
      }
    ),
  
  // Email opcional, mas deve ser válido se preenchido
  email: z
    .string()
    .email('Formato de e-mail inválido.')
    .optional()
    .or(z.literal('')), // Permite vazio
  
  // Campos de endereço opcionais
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  
  // Estado (UF) deve ter 2 caracteres se preenchido
  endereco_estado: z
    .string()
    .length(2, 'UF deve ter 2 caracteres.')
    .optional()
    .or(z.literal('')),
  
  // CEP com validação de formato
  endereco_cep: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true; // Aceita vazio
        return cepRegex.test(value);
      },
      {
        message: "Formato de CEP inválido. Use XXXXX-XXX ou XXXXXXXX.",
      }
    ),
  
  // Observações opcionais
  observacoes: z.string().optional(),
  
  // Timestamps gerenciados pelo DB/RLS
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Tipo inferido do schema Zod para uso no TypeScript
export type Fornecedor = z.infer<typeof fornecedorSchema>;

// Schema para validação na edição (todos os campos são opcionais)
export const fornecedorUpdateSchema = fornecedorSchema.partial(); 