import React from 'react'
import { Product } from '@/types/sales'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from "@/components/ui/label"
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'

interface SaleItemData {
    produto_id: string | null
    quantidade: number
    preco_unitario: number
    isManual?: boolean
    descricao_manual?: string | null
}

interface SaleFormItemProps {
  index: number
  products: Product[]
  item: SaleItemData
  onUpdate: (index: number, field: keyof SaleItemData | string, value: any) => void
  onRemove: (index: number) => void
}

const SaleFormItem: React.FC<SaleFormItemProps> = ({ 
  index, 
  products, 
  item, 
  onUpdate, 
  onRemove 
}) => {
  const isManual = item.isManual ?? false; 

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      onUpdate(index, 'produto_id', productId)
      onUpdate(index, 'preco_unitario', product.preco_venda ?? 0)
      onUpdate(index, 'descricao_manual', null)
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    onUpdate(index, 'isManual', checked); 
    if (checked) {
        onUpdate(index, 'produto_id', null);
        onUpdate(index, 'preco_unitario', 0);
    } else {
        onUpdate(index, 'descricao_manual', null);
        onUpdate(index, 'preco_unitario', 0);
    }
  };

  const subtotal = (item.quantidade || 0) * (item.preco_unitario || 0)

  return (
    <div className="flex flex-col md:flex-row items-start md:items-stretch gap-2 p-3 border rounded relative bg-muted/20">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute -right-2 -top-2 p-0.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 z-10"
        aria-label="Remover item"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      
      <div className="flex-1 w-full space-y-3">
        <div className="flex items-center space-x-2 mb-2">
            <Switch
                id={`manual-switch-${index}`}
                checked={isManual}
                onCheckedChange={handleSwitchChange}
                className="data-[state=checked]:bg-blue-600"
                aria-labelledby={`manual-switch-label-${index}`}
            />
            <Label htmlFor={`manual-switch-${index}`} id={`manual-switch-label-${index}`} className="text-sm cursor-pointer">
                Digitar item manualmente?
            </Label>
        </div>

        <div className='space-y-1'>
          <Label className="text-xs">
            {isManual ? "Descrição do Item Manual" : "Produto Cadastrado"}
          </Label>
          {isManual ? (
              <Input 
                  id={`desc-${index}`}
                  placeholder="Digite a descrição do item"
                  value={item.descricao_manual || ''}
                  onChange={(e) => onUpdate(index, 'descricao_manual', e.target.value)}
                  aria-label="Descrição do Item Manual"
              />
          ) : (
             <Select
                 value={item.produto_id || ''}
                 onValueChange={handleProductChange}
                 aria-label="Selecionar Produto Cadastrado"
             >
                 <SelectTrigger id={`prod-select-${index}`}>
                     <SelectValue placeholder="Selecione um produto" />
                 </SelectTrigger>
                 <SelectContent>
                     {products.map(product => (
                     <SelectItem key={product.id} value={product.id}>
                        <div className="flex justify-between items-center w-full">
                            <span> 
                                {product.nome} {product.preco_venda ? `- ${formatCurrency(product.preco_venda)}` : ''}
                            </span>
                            <span className="text-xs text-muted-foreground ml-4">
                                {product.quantidade_disponivel !== undefined ? 
                                    `${product.quantidade_disponivel} disp.` : 
                                    `Qtd: ${product.quantidade}`}
                            </span>
                        </div>
                     </SelectItem>
                     ))}
                 </SelectContent>
             </Select>
          )}
        </div>
      </div>

      <div className="w-full md:w-20 space-y-1 self-end">
         <Label htmlFor={`qtd-${index}`} className="text-xs">Qtd.</Label>
          <Input
            id={`qtd-${index}`}
            type="number"
            min="1"
            value={item.quantidade}
            onChange={(e) => onUpdate(index, 'quantidade', parseInt(e.target.value) || 1)}
            className="h-9"
            aria-label="Quantidade"
          />
      </div>

      <div className="w-full md:w-28 space-y-1 self-end">
          <Label htmlFor={`preco-${index}`} className="text-xs">Preço Un.</Label>
          <Input
              id={`preco-${index}`}
              type="number"
              step="0.01"
              min="0"
              placeholder="R$ 0,00"
              value={item.preco_unitario}
              onChange={(e) => onUpdate(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
              className="h-9"
              aria-label="Preço Unitário"
          />
      </div>

      <div className="w-full md:w-24 flex items-end justify-end space-y-1 self-end pb-1">
         <span className="font-medium text-sm md:text-base">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  )
}

export default SaleFormItem
