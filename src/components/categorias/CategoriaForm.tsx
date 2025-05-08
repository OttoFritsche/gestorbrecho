import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategoriaFormData, categoriaSchema } from '@/lib/validations/categoriaSchema';
import { Categoria, categoriaTipos } from '@/lib/types/categoria';

// Importa componentes da UI (Shadcn/UI)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// TODO: Importar componente ColorPicker
// import ColorPicker from '@/components/ui/color-picker'; // Exemplo

// Props para o formulário
interface CategoriaFormProps {
  onSubmit: (data: CategoriaFormData) => void; // Função chamada ao submeter com sucesso
  initialData?: Categoria | null; // Dados iniciais para edição (opcional)
  isSubmitting?: boolean; // Indica se o formulário está sendo submetido (para desabilitar botão)
}

// Função para capitalizar a primeira letra (usado para Tipos no Select)
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CategoriaForm: React.FC<CategoriaFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  // Configuração do react-hook-form com Zod
  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      tipo: initialData?.tipo || undefined,
      descricao: initialData?.descricao || '',
      cor: initialData?.cor || ''
    },
  });

  // Função intermediária para lidar com a submissão
  const handleFormSubmit = (data: CategoriaFormData) => {
    // Remover valores nulos/vazios opcionais antes de enviar, se necessário
    const submitData = {
        ...data,
        descricao: data.descricao?.trim() === '' ? null : data.descricao,
        cor: data.cor?.trim() === '' ? null : data.cor,
    };
    onSubmit(submitData);
  };

  return (
    // Componente Form do Shadcn/UI para estrutura e acessibilidade
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Campo Nome */}
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Roupas de Verão" {...field} />
              </FormControl>
              <FormDescription>
                O nome principal para identificar a categoria.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Tipo */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo da categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoriaTipos.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {capitalize(tipo)} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Classifique a categoria para organização (Produto, Despesa, etc.).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                {/* Usando type assertion para corrigir tipo null vs undefined */}
                <Textarea
                  placeholder="Algum detalhe adicional sobre esta categoria (opcional)"
                  className="resize-none" // Opcional: desabilita redimensionamento
                  {...field}
                  value={field.value ?? ''} // Garante que o valor nunca seja null para o Textarea
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Cor */}
        <FormField
          control={form.control}
          name="cor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                 {/* Usando input nativo type="color" */}
                 <div className='flex items-center gap-4'> {/* Aumentado o gap */}
                    <Input 
                        type="color" // Mudança aqui!
                        className='h-10 w-16 cursor-pointer p-1 border-2' // Estilo básico para o seletor
                        {...field} 
                        value={field.value ?? '#ffffff'} // Define um valor padrão (branco) se nulo
                     />
                    {/* Mostra o valor hexadecimal selecionado (opcional, mas útil) */}
                    {field.value && (
                        <span className="text-sm text-muted-foreground font-mono">{field.value}</span>
                    )}
                 </div>
              </FormControl>
               <FormDescription>
                Clique no quadrado para escolher uma cor visualmente (opcional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botão de Submissão */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Categoria')}
        </Button>
      </form>
    </Form>
  );
};

export default CategoriaForm; 