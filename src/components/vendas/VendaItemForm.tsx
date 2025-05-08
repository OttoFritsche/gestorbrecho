import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Trash2 } from 'lucide-react';
import { Produto as ProdutoDisponivel } from '@/hooks/useVendaForm';
import { VendaFormValues } from '@/hooks/useVendaForm';
import ProdutoSelect from '@/components/produtos/ProdutoSelect';
import { Produto } from '@/lib/types/produto';

type VendaItemFormProps = {
  produtosData?: ProdutoDisponivel[];
};

export function VendaItemForm({ produtosData = [] }: VendaItemFormProps) {
  const form = useFormContext<VendaFormValues>();
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens"
  });
  
  const watchedItens = form.watch("itens");
  
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-lg font-semibold font-serif">Itens da Venda</h3>
      {fields.map((field, index) => {
        const currentItem = watchedItens[index] || {};
        const isManual = currentItem.isManual;
        return (
          <div key={field.id} className="flex flex-col md:flex-row items-start md:items-end space-y-2 md:space-y-0 md:space-x-0 md:gap-4 p-3 border rounded">
            <div className="flex-1 w-full md:w-auto">
              <FormField
                control={form.control}
                name={`itens.${index}.isManual`}
                render={({ field: switchField }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 mb-2">
                    <FormLabel className="text-sm">{isManual ? "Descrição Manual" : "Produto do Estoque"}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={switchField.value}
                        onCheckedChange={(checked) => {
                          switchField.onChange(checked);
                          form.setValue(`itens.${index}.produto_id`, null);
                          form.setValue(`itens.${index}.descricao_manual`, null);
                          form.setValue(`itens.${index}.preco_unitario`, 0);
                          form.setValue(`itens.${index}.subtotal`, 0);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {isManual ? (
                <FormField
                  control={form.control}
                  name={`itens.${index}.descricao_manual`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel className="text-xs text-muted-foreground">Descrição</FormLabel>
                      <FormControl><Input placeholder="Digite a descrição" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name={`itens.${index}.produto_id`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel className="text-xs text-muted-foreground">Produto</FormLabel>
                      <ProdutoSelect
                        selectedValue={field.value}
                        onValueChange={(value, produtoSelecionado) => {
                          field.onChange(value);
                          form.setValue(`itens.${index}.preco_unitario`, produtoSelecionado?.preco_venda ?? 0);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField control={form.control} name={`itens.${index}.quantidade`} render={({ field }) => (
              <FormItem className="w-full md:w-20">
                <FormLabel>Qtd.</FormLabel>
                <FormControl><Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            
            <FormField control={form.control} name={`itens.${index}.preco_unitario`} render={({ field }) => (
              <FormItem className="w-full md:w-28">
                <FormLabel>Preço Un.</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            
            <div className="w-full md:w-28">
              <FormLabel>Subtotal</FormLabel>
              <Input readOnly value={form.watch(`itens.${index}.subtotal`)?.toFixed(2) ?? '0.00'} className="bg-muted/50" />
            </div>
            
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={() => remove(index)} 
              className="self-end mt-4 md:mt-0"
              disabled={fields.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      {form.formState.errors.itens && typeof form.formState.errors.itens !== 'object' && (
        <p className="text-sm font-medium text-destructive">{form.formState.errors.itens.message}</p>
      )}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ produto_id: null, descricao_manual: null, quantidade: 1, preco_unitario: 0, subtotal: 0, isManual: false })}
      >
        Adicionar Item
      </Button>
    </div>
  );
}
