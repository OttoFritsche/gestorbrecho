import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast'; // Usaremos toast para feedback
import { useNavigate, Link } from 'react-router-dom'; // Para redirecionamento
import { ArrowLeft } from 'lucide-react'; // Importar ícone de seta
import logoImage from '@/assets/logo/1.png'; // Importar o logo

// Schema de validação com Zod
const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate(); // Hook para navegação programática

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      // Login bem-sucedido!
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Redirecionando para o painel...',
      });
      // Redirecionar para a página principal/dashboard após um pequeno delay
      setTimeout(() => navigate('/app'), 1000);

    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: error.message || 'Ocorreu um erro ao tentar fazer login. Verifique suas credenciais.',
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
        className="h-28 mb-08 opacity-0 animate-fade-in"
      />

      <Card 
        className="w-full max-w-sm opacity-0 animate-fade-in" 
        style={{ animationDelay: '0.2s' }} 
      >
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-center text-[#92400e]">Login</CardTitle>
          <CardDescription className="text-muted-foreground text-center pt-1"> 
            Insira seu email e senha para acessar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default LoginPage;
