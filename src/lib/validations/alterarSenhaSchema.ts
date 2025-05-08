import { z } from 'zod';

// Define o schema de validação para o formulário de alteração de senha
export const alterarSenhaSchema = z.object({
  // Campo novaSenha é obrigatório (string)
  novaSenha: z.string()
    // Mínimo de 6 caracteres para a senha
    .min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' }),
  // Campo confirmaSenha é obrigatório (string)
  confirmaSenha: z.string()
    .min(1, { message: 'Por favor, confirme sua nova senha.' }),
})
// Adiciona uma validação refinada para garantir que as senhas coincidam
.refine((data) => data.novaSenha === data.confirmaSenha, {
  // Mensagem de erro se as senhas não baterem
  message: 'As senhas não coincidem.',
  // Aplica este erro especificamente ao campo de confirmação
  path: ['confirmaSenha'],
});

// Define o tipo TypeScript inferido a partir do schema Zod
export type AlterarSenhaFormData = z.infer<typeof alterarSenhaSchema>; 