import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Esquema de validação Zod
const interestFormSchema = z.object({
  nome_brecho: z.string().optional(),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  telefone: z.string().optional(),
});

type InterestFormValues = z.infer<typeof interestFormSchema>;

interface InterestModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: React.ReactNode; // Elemento que aciona o modal
  title?: string;
  description?: string;
}

export function InterestModalForm({
  open,
  onOpenChange,
  triggerButton,
  title = "Demonstre seu Interesse",
  description = "Preencha os campos abaixo e entraremos em contato em breve.",
}: InterestModalFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: {
      nome_brecho: '',
      email: '',
      telefone: '',
    },
  });

  const onSubmit = async (values: InterestFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-interest', {
        body: {
          email: values.email,
          nome_brecho: values.nome_brecho,
          telefone: values.telefone,
        },
      });

      if (error) throw error;

      toast({
        title: 'Interesse Registrado!',
        description: 'Obrigado! Entraremos em contato em breve.',
      });
      form.reset();
      onOpenChange(false); // Fecha o modal
    } catch (error: any) {
      console.error('Erro ao registrar interesse:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Registrar Interesse',
        description: error.message || (error.details && error.details[0]?.message) || 'Ocorreu um erro. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nome_brecho"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Brechó (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Brechó Chic" {...field} />
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
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Interesse
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 