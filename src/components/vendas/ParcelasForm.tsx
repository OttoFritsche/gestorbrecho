
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { VendaFormValues } from '@/hooks/useVendaForm';

export function ParcelasForm() {
  const form = useFormContext<VendaFormValues>();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded bg-muted/40">
      <FormField
        control={form.control}
        name="num_parcelas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Parcelas</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="1" 
                placeholder="Ex: 2" 
                {...field} 
                onChange={event => field.onChange(+event.target.value)} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="primeiro_vencimento"
        render={({ field }) => (
          <FormItem className="flex flex-col pt-2">
            <FormLabel>Data do 1º Vencimento</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: ptBR })
                    ) : (
                      <span>Escolha uma data</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                  initialFocus
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
