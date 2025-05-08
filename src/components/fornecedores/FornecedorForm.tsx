import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Fornecedor, fornecedorSchema } from "@/lib/validations/fornecedorSchema";
import { formatCPFOrCNPJ } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

// Tipo de dados para o formulário (omite campos gerenciados pelo sistema)
type FornecedorFormData = Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

interface FornecedorFormProps {
  initialData?: Fornecedor;
  onSubmit: (data: FornecedorFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function FornecedorForm({ initialData, onSubmit, isSubmitting }: FornecedorFormProps) {
  const navigate = useNavigate();
  const [formattedCpfCnpj, setFormattedCpfCnpj] = useState("");
  
  // Configuração do formulário com React Hook Form e Zod
  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema.omit({ id: true, created_at: true, updated_at: true, user_id: true })),
    defaultValues: {
      nome_razao_social: initialData?.nome_razao_social || "",
      nome_fantasia: initialData?.nome_fantasia || "",
      cnpj_cpf: initialData?.cnpj_cpf || "",
      ie_rg: initialData?.ie_rg || "",
      contato_principal: initialData?.contato_principal || "",
      telefone: initialData?.telefone || "",
      email: initialData?.email || "",
      endereco_logradouro: initialData?.endereco_logradouro || "",
      endereco_numero: initialData?.endereco_numero || "",
      endereco_complemento: initialData?.endereco_complemento || "",
      endereco_bairro: initialData?.endereco_bairro || "",
      endereco_cidade: initialData?.endereco_cidade || "",
      endereco_estado: initialData?.endereco_estado || "",
      endereco_cep: initialData?.endereco_cep || "",
      observacoes: initialData?.observacoes || "",
    },
  });
  
  // Atualiza o valor formatado do CNPJ/CPF quando o valor do campo muda
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "cnpj_cpf" || name === undefined) {
        const cpfCnpj = value.cnpj_cpf;
        if (cpfCnpj) {
          setFormattedCpfCnpj(formatCPFOrCNPJ(cpfCnpj));
        } else {
          setFormattedCpfCnpj("");
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Handler para submissão do formulário
  const handleSubmit = async (data: FornecedorFormData) => {
    try {
      // Remove formatação do CNPJ/CPF para salvar apenas os números
      if (data.cnpj_cpf) {
        data.cnpj_cpf = data.cnpj_cpf.replace(/\D/g, '');
      }
      
      // Remove formatação do CEP para salvar apenas os números
      if (data.endereco_cep) {
        data.endereco_cep = data.endereco_cep.replace(/\D/g, '');
      }
      
      // Converte estado para maiúsculo
      if (data.endereco_estado) {
        data.endereco_estado = data.endereco_estado.toUpperCase();
      }
      
      await onSubmit(data);
    } catch (error) {
      toast.error("Erro ao salvar fornecedor");
      console.error("Erro ao salvar fornecedor:", error);
    }
  };
  
  // Handler para voltar à listagem
  const handleCancel = () => {
    navigate("/app/fornecedores");
  };
  
  // Handler para formatação do CNPJ/CPF
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove caracteres não numéricos
    const value = e.target.value.replace(/\D/g, '');
    
    // Atualiza o valor no formulário
    form.setValue("cnpj_cpf", value);
    
    // Atualiza o valor formatado para exibição
    setFormattedCpfCnpj(formatCPFOrCNPJ(value));
  };
  
  // Handler para formatação do CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove caracteres não numéricos
    const value = e.target.value.replace(/\D/g, '');
    
    // Formata o CEP
    const cepFormatado = value.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    
    e.target.value = value.length <= 8 ? cepFormatado : cepFormatado.substring(0, 9);
    
    // Atualiza o valor no formulário
    form.setValue("endereco_cep", value.substring(0, 8));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          className="gap-1" 
          onClick={handleCancel}
        >
          <ArrowLeft size={16} />
          Voltar para lista
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Fornecedor'
            )}
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Seção Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Dados básicos do fornecedor para identificação
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Nome/Razão Social */}
              <FormField
                control={form.control}
                name="nome_razao_social"
                render={({ field }) => (
                  <FormItem className="col-span-full sm:col-span-2">
                    <FormLabel>Nome/Razão Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome ou Razão Social" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Nome Fantasia */}
              <FormField
                control={form.control}
                name="nome_fantasia"
                render={({ field }) => (
                  <FormItem className="col-span-full sm:col-span-2">
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome Fantasia (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* CNPJ/CPF */}
              <FormField
                control={form.control}
                name="cnpj_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CNPJ ou CPF"
                        value={formattedCpfCnpj}
                        onChange={handleCpfCnpjChange}
                        maxLength={18} // Tamanho máximo do CNPJ formatado
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* IE/RG */}
              <FormField
                control={form.control}
                name="ie_rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IE/RG</FormLabel>
                    <FormControl>
                      <Input placeholder="Inscrição Estadual ou RG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Seção Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
              <CardDescription>
                Dados para comunicação com o fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Contato Principal */}
              <FormField
                control={form.control}
                name="contato_principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato Principal</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do contato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Telefone */}
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Seção Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Localização do fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* CEP */}
              <FormField
                control={form.control}
                name="endereco_cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00000-000" 
                        maxLength={9}
                        onChange={handleCepChange}
                        defaultValue={field.value ? 
                          field.value.replace(/^(\d{5})(\d{3})$/, '$1-$2') : 
                          ''
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Logradouro */}
              <FormField
                control={form.control}
                name="endereco_logradouro"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Número */}
              <FormField
                control={form.control}
                name="endereco_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="Número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Complemento */}
              <FormField
                control={form.control}
                name="endereco_complemento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Sala, Bloco, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Bairro */}
              <FormField
                control={form.control}
                name="endereco_bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Cidade */}
              <FormField
                control={form.control}
                name="endereco_cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Estado */}
              <FormField
                control={form.control}
                name="endereco_estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="UF" 
                        maxLength={2}
                        {...field}
                        onChange={e => {
                          const upperValue = e.target.value.toUpperCase();
                          e.target.value = upperValue;
                          field.onChange(upperValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Seção Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Informações adicionais sobre o fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre o fornecedor" 
                        className="resize-none h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Fornecedor'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 