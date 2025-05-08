import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { produtoSchema } from '@/lib/validations/produtoSchema';
import { ProdutoFormData, ProdutoStatus } from '@/lib/types/produto';
import CategoriaSelect from '@/components/categorias/CategoriaSelect'; // Caminho corrigido
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // Importação corrigida

// Constante para o placeholder complexo
const atributosPlaceholder = `Exemplos de atributos:
Tamanho: M
Cor: Azul Marinho
Marca: Marca Famosa
Material: Algodão`;

// Tipo para as props do formulário
interface ProdutoFormProps {
  onSubmit: (data: ProdutoFormData) => Promise<void>; // Função chamada ao submeter
  initialData?: Partial<ProdutoFormData> | null; // Dados iniciais para edição
  isSubmitting: boolean; // Flag para indicar se o formulário está sendo enviado
  onCancel: () => void; // Nova prop para cancelar
}

// Componente do formulário de Produto
const ProdutoForm: React.FC<ProdutoFormProps> = ({ onSubmit, initialData, isSubmitting, onCancel }) => {
  // Estado para preview da imagem
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imagem_url || null);

  // Função para calcular os valores padrão baseados nos dados iniciais
  const getDefaultValues = useCallback((data?: Partial<ProdutoFormData> | null) => {
    return {
      nome: data?.nome || '',
      descricao: data?.descricao || '',
      categoria_id: data?.categoria_id || null,
      sku: data?.sku || '',
      preco_custo: data?.preco_custo || null,
      preco_venda: data?.preco_venda || 0,
      quantidade: data?.quantidade || 1,
      status: data?.status || 'disponivel',
      atributos: (() => {
        if (!data?.atributos) return '';
        if (typeof data.atributos === 'string') {
          try {
            return JSON.stringify(JSON.parse(data.atributos), null, 2);
          } catch {
            return data.atributos;
          }
        } else if (typeof data.atributos === 'object') {
          try {
            return JSON.stringify(data.atributos, null, 2);
          } catch {
            return '';
          }
        }
        return '';
      })(),
      imagem: undefined,
      imagem_url: data?.imagem_url || null,
    };
  }, []);

  // Inicializa o react-hook-form
  const form = useForm<z.infer<typeof produtoSchema>>({
    resolver: zodResolver(produtoSchema),
    defaultValues: getDefaultValues(initialData),
  });

  // Efeito para resetar o formulário quando initialData mudar
  useEffect(() => {
    const newDefaultValues = getDefaultValues(initialData);
    form.reset(newDefaultValues);
    // Atualiza também o preview da imagem ao resetar
    setImagePreview(initialData?.imagem_url || null);
  }, [initialData, form.reset, getDefaultValues]);

  // Observa mudanças no campo de imagem do formulário
  const imagemField = form.watch('imagem');

  // Efeito para atualizar o preview da imagem ao selecionar novo arquivo
  useEffect(() => {
    if (imagemField && imagemField.length > 0) {
      const file = imagemField[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
       // Se não há arquivo selecionado, mantém o preview da initialData.imagem_url (se houver)
       // A remoção explícita é tratada em handleRemoveImage
       if (!form.getValues('imagem_url')) { // Só limpa se não tiver URL base
         setImagePreview(null);
       }
    }
    // Não depende mais de initialData aqui, pois o reset já trata isso.
  }, [imagemField, form]);

  // Função para remover a imagem (limpa o campo e o preview)
  const handleRemoveImage = useCallback(() => {
    form.setValue('imagem', null); // Marca como null para indicar remoção no backend
    form.setValue('imagem_url', null); // Remove a URL existente
    setImagePreview(null);
    // Limpa o valor do input file nativo resetando o campo
    const fileInput = document.getElementById('imagem-produto-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [form]);

  // Handler para submissão do formulário
  const handleFormSubmit = async (values: z.infer<typeof produtoSchema>) => {
    // Converte preços para número (Zod já faz, mas reforçamos)
    const dataToSubmit: ProdutoFormData = {
      ...values,
      nome: values.nome, // Garante explicitamente que nome está aqui
      status: values.status as ProdutoStatus,
      preco_custo: values.preco_custo ? Number(values.preco_custo) : null,
      preco_venda: Number(values.preco_venda),
      quantidade: Number(values.quantidade),
      // Passa null se o file input foi explicitamente limpo
      imagem: values.imagem === null ? null : values.imagem?.[0] ? values.imagem : undefined,
    };
    await onSubmit(dataToSubmit);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <ScrollArea className="h-[60vh] md:h-[70vh] pr-4"> {/* Ajusta altura e adiciona padding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna da Esquerda: Imagem e Preços */}
            <div className="md:col-span-1 space-y-6">
              {/* Card da Imagem */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#92400e]">Imagem do Produto</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <FormField
                    control={form.control}
                    name="imagem"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel htmlFor="imagem-produto-input" className={`cursor-pointer flex justify-center items-center border-2 border-dashed rounded-md h-48 w-full ${imagePreview ? 'border-transparent' : 'border-gray-300'} hover:border-[#92400e]`}>
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-md" />
                          ) : (
                            <span className="text-gray-500 text-sm text-center">Clique ou arraste para adicionar uma imagem</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="imagem-produto-input"
                            type="file"
                            accept="image/jpeg, image/png, image/webp"
                            className="hidden" // Esconde o input nativo
                            onChange={(e) => field.onChange(e.target.files)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {imagePreview && (
                    <Button variant="outline" size="sm" onClick={handleRemoveImage} className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 w-full">
                      <Trash2 className="mr-2 h-4 w-4" /> Remover Imagem
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Card de Preços */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#92400e]">Precificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="preco_venda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 29.90" {...field} step="0.01" min="0" />
                        </FormControl>
                        <FormDescription>
                          O valor pelo qual o item será vendido.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preco_custo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo (Opcional)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 10.00" {...field} step="0.01" min="0" value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>
                          Quanto você pagou pelo item (se souber).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Coluna da Direita: Detalhes do Produto */}
            <div className="md:col-span-2 space-y-6">
              {/* Card de Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#92400e]">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Camisa Jeans Azul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detalhes sobre o produto (marca, estado, etc.)"
                            className="resize-none"
                            {...field}
                            value={field.value ?? ''}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card de Organização e Estoque */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#92400e]">Organização e Estoque</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria (Opcional)</FormLabel>
                        <CategoriaSelect
                          tipo="produto"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormDescription>
                          Agrupa itens semelhantes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU / Código (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu código único" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>
                          Identificador único do item.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade *</FormLabel>
                        <FormControl>
                          {/* Geralmente 1 para brechós, mas permitimos outros valores */}
                          <Input type="number" placeholder="1" {...field} min="0" step="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="disponivel">Disponível</SelectItem>
                            <SelectItem value="reservado">Reservado</SelectItem>
                            <SelectItem value="vendido">Vendido</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card de Atributos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#92400e]">Atributos Adicionais (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="atributos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atributos Adicionais (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={atributosPlaceholder}
                            className="resize-y font-mono text-sm"
                            rows={6}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Adicione detalhes extras do produto (Ex: Tamanho: M, Cor: Azul, Material: Algodão).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>

        {/* Botões de Ação (Salvar e Cancelar) */}
        <div className="flex justify-end gap-2 pt-4 border-t"> {/* Adiciona gap-2 para espaçamento */}
          {/* Botão Cancelar */}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>

          {/* Botão de Submissão (Salvar/Cadastrar) */}
          <Button type="submit" disabled={isSubmitting} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
            {isSubmitting ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Cadastrar Produto')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProdutoForm; 