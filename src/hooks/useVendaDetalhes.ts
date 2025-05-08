
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { fetchSaleById, updateParcelaStatus } from '@/services/saleService'

export const useVendaDetalhes = () => {
  const [detailedSale, setDetailedSale] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchSaleDetails = useCallback(async (saleId: string) => {
    if (!saleId) return;
    setLoadingDetail(true);
    setDetailedSale(null);
    
    try {
      const data = await fetchSaleById(saleId);
      console.log("Venda detalhada buscada:", data);
      setDetailedSale(data);
    } catch (error: any) {
      console.error("Erro ao buscar detalhes da venda:", error);
      toast.error('Erro ao buscar detalhes da venda', { description: error.message });
      setDetailedSale(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleUpdateParcelaStatus = async (parcelaId: string, newStatus: 'pago' | 'aguardando' | 'cancelado') => {
    setLoadingDetail(true);
    try {
      await updateParcelaStatus(parcelaId, newStatus);
      toast.success(`Parcela marcada como ${newStatus}!`);
      
      if (detailedSale?.id) {
        await fetchSaleDetails(detailedSale.id);
      }
    } catch (error: any) {
      console.error("Erro ao atualizar status da parcela:", error);
      toast.error('Erro ao atualizar status da parcela', { description: error.message });
      throw error;
    } finally {
      setLoadingDetail(false);
    }
  };

  return { 
    detailedSale, 
    loadingDetail, 
    fetchSaleDetails, 
    updateParcelaStatus: handleUpdateParcelaStatus 
  }
}
