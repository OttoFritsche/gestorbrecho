import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ArrowLeft } from 'lucide-react';
import logoImage from '@/assets/logo/1.png';

// Schema de validação com Zod, incluindo novos campos
const formSchema = z.object({
  nome_completo: z.string().min(3, { message: 'Nome completo é obrigatório.' }),
  nome_empresa: z.string().min(2, { message: 'Nome do brechó é obrigatório.' }),
  telefone: z.string().optional(), // Telefone pode ser opcional
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string().min(6, { message: 'A confirmação deve ter pelo menos 6 caracteres.' })
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_completo: '',
      nome_empresa: '',
      telefone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSignup = async (values: z.infer<typeof formSchema>) => {
    console.log("handleSignup chamada com:", values);
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // 1. Criar o usuário sem verificação de email
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            nome_completo: values.nome_completo,
            nome_empresa: values.nome_empresa,
            telefone: values.telefone || null,
          },
          // Não enviará email de confirmação
          emailRedirectTo: window.location.origin + '/login',
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você já pode fazer login no sistema.',
        duration: 5000,
      });

      // Redirecionar para o login após o cadastro bem-sucedido
      setTimeout(() => navigate('/login'), 2000);

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      // Mensagem de erro mais amigável com base no tipo de erro
      if (error.message.includes("rate limit")) {
        setErrorMessage("Limite de cadastros excedido. Por favor, tente novamente mais tarde ou entre em contato com o suporte.");
      } else if (error.message.includes("User already registered")) {
        setErrorMessage("Este email já está registrado. Por favor, faça login ou use outro email.");
      } else {
        setErrorMessage(error.message || 'Ocorreu um erro ao tentar criar a conta.');
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error.message || 'Ocorreu um erro ao tentar criar a conta.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-rose-50 to-amber-50 p-4 pt-20 relative">
      <div className="absolute top-4 left-4">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Início
        </Link>
      </div>

      <img 
        src={logoImage} 
        alt="Gestor Brechó Logo" 
        className="h-28 mb-8 opacity-0 animate-fade-in" 
      />

      <Card 
        className="w-full max-w-2xl opacity-0 animate-fade-in" 
        style={{ animationDelay: '0.2s' }}
      >
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-center text-[#92400e]">Cadastro</CardTitle>
          <CardDescription className="text-muted-foreground text-center pt-1">
            Crie sua conta para acessar o Gestor Brechó.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nome_empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Brechó</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do seu brechó" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seuemail@exemplo.com" {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input placeholder="******" {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input placeholder="******" {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full md:col-span-2" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignupPage;
