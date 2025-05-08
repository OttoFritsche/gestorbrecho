import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { alterarSenhaSchema, AlterarSenhaFormData } from '@/lib/validations/alterarSenhaSchema';
import { supabase } from '@/integrations/supabase/client'; // Importar cliente Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/loading-spinner';

const AlterarSenhaForm: React.FC = () => {
  // Configuração do formulário com react-hook-form e Zod
  const {
    register,         // Função para registrar inputs
    handleSubmit,     // Função para lidar com a submissão
    reset,            // Função para resetar o formulário
    formState: {
      errors,         // Objeto contendo erros de validação
      isSubmitting    // Booleano indicando se o form está sendo submetido
    },
  } = useForm<AlterarSenhaFormData>({
    resolver: zodResolver(alterarSenhaSchema), // Usa o schema Zod para validação
  });

  // Função executada ao submeter o formulário válido
  const onSubmit = async (data: AlterarSenhaFormData) => {
    try {
      // Chama a função updateUser do Supabase Auth para alterar a senha
      const { error } = await supabase.auth.updateUser({
        password: data.novaSenha // Passa a nova senha
      });

      // Verifica se ocorreu erro na atualização
      if (error) {
        // Loga o erro e lança para o catch
        console.error('Erro ao atualizar senha:', error);
        throw new Error(error.message || 'Não foi possível atualizar a senha.');
      }

      // Exibe notificação de sucesso
      toast.success('Senha alterada com sucesso!');
      // Reseta o formulário após o sucesso
      reset();

    } catch (err: any) {
      // Exibe notificação de erro
      toast.error(`Erro: ${err.message}`);
    }
  };

  // Renderiza o formulário dentro de um Card
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
        <CardDescription>Digite sua nova senha abaixo. Recomendamos uma senha forte.</CardDescription>
      </CardHeader>
      {/* // Formulário com manipulador de submissão */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* // Campo Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova Senha</Label>
            <Input
              id="novaSenha"
              type="password" // Tipo password para ocultar a senha
              {...register('novaSenha')}
              className={errors.novaSenha ? 'border-red-500' : ''} // Adiciona borda vermelha em caso de erro
            />
            {/* // Exibe mensagem de erro se houver */}
            {errors.novaSenha && <p className="text-red-500 text-sm">{errors.novaSenha.message}</p>}
          </div>
          {/* // Campo Confirmar Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmaSenha">Confirmar Nova Senha</Label>
            <Input
              id="confirmaSenha"
              type="password"
              {...register('confirmaSenha')}
              className={errors.confirmaSenha ? 'border-red-500' : ''}
            />
            {/* // Exibe mensagem de erro se houver */}
            {errors.confirmaSenha && <p className="text-red-500 text-sm">{errors.confirmaSenha.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          {/* // Botão de submit com estado de carregamento */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <LoadingSpinner size="small" className="mr-2" />} {/* // Mostra spinner durante o envio */}
            {isSubmitting ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AlterarSenhaForm; 