import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * Hook reutilizável para gerenciar o estado de seleção de itens em uma lista.
 * @param items - O array completo de itens.
 * @param itemIdKey - A chave no objeto do item que contém o ID único (padrão: 'id').
 */
export function useSelectionState<T extends { [key: string]: any }>(
  items: T[], 
  itemIdKey: keyof T = 'id'
) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const prevItemsLengthRef = useRef<number>(items.length);
  
  // Limpa a seleção apenas se a quantidade de itens mudar significativamente
  useEffect(() => {
    // Verifica se houve mudança na quantidade de itens que justifique reset
    // Isso evita resets desnecessários durante re-renderizações
    if (prevItemsLengthRef.current !== items.length) {
      setSelectedItems(new Set());
      prevItemsLengthRef.current = items.length;
    }
  }, [items.length]); // Dependência na quantidade e não no array completo

  // Função para selecionar/desselecionar todos os itens
  const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
    if (checked === true) {
      // Seleciona todos os IDs
      const allIds = new Set(items.map(item => String(item[itemIdKey])));
      setSelectedItems(allIds);
    } else {
      // Limpa a seleção
      setSelectedItems(new Set());
    }
  }, [items, itemIdKey]);

  // Função para selecionar/desselecionar um único item
  const handleSelectSingle = useCallback((itemId: string, checked: boolean | 'indeterminate') => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (checked === true) {
        newSelected.add(itemId);
      } else {
        newSelected.delete(itemId);
      }
      return newSelected;
    });
  }, []);

  // Calcula o estado do checkbox "Selecionar Todos"
  const selectAllState = useMemo<boolean | 'indeterminate'>(() => {
    if (!items || items.length === 0) return false; // Sem itens, desmarcado
    if (selectedItems.size === 0) return false; // Nenhum selecionado, desmarcado
    if (selectedItems.size === items.length) return true; // Todos selecionados, marcado
    return 'indeterminate'; // Alguns selecionados, indeterminado
  }, [selectedItems, items]);

  // Função para limpar a seleção manualmente
  const resetSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return {
    selectedItems,          // O Set com os IDs selecionados
    handleSelectAll,        // Função para o checkbox "Selecionar Todos"
    handleSelectSingle,     // Função para checkboxes individuais
    selectAllState,         // Estado do checkbox "Selecionar Todos"
    resetSelection,         // Função para limpar a seleção
  };
} 