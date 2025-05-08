import { supabase } from '@/integrations/supabase/client';
import { BalancoPatrimonialData } from '@/types/financeiro';
import { format } from 'date-fns';

/**
 * Calcula os dados do balanço patrimonial para uma data de referência específica.
 * @param dataReferencia - A data limite para considerar receitas e despesas (formato YYYY-MM-DD).
 * @returns Um objeto contendo Ativos, Passivos e Patrimônio Líquido.
 */
export const calcularBalancoPatrimonial = async (dataReferencia: string): Promise<BalancoPatrimonialData> => {
  try {
    // Calcular Total de Ativos (Soma de todas as receitas até a data de referência)
    // Considera a coluna 'data' da tabela 'receitas'
    const { data: ativosData, error: ativosError } = await supabase
      .from('receitas')
      .select('valor')
      .lte('data', dataReferencia); // Menor ou igual à data de referência

    if (ativosError) {
      console.error('Erro ao buscar ativos (receitas):', ativosError);
      throw new Error('Não foi possível calcular os ativos.');
    }
    const totalAtivos = ativosData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

    // Calcular Total de Passivos (Soma de todas as despesas até a data de referência)
    // Considera a coluna 'data' da tabela 'despesas' (data de registro/pagamento)
    // Alternativa: usar 'data_vencimento' se a intenção for passivos exigíveis
    const { data: passivosData, error: passivosError } = await supabase
      .from('despesas')
      .select('valor')
      .lte('data', dataReferencia); // Menor ou igual à data de referência

    if (passivosError) {
      console.error('Erro ao buscar passivos (despesas):', passivosError);
      throw new Error('Não foi possível calcular os passivos.');
    }
    const totalPassivos = passivosData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

    // Calcular Patrimônio Líquido
    const patrimonioLiquido = totalAtivos - totalPassivos;

    // TODO: Implementar busca detalhada se necessário (ativos por tipo, passivos por categoria)
    // Exemplo para passivos por categoria (requer join ou múltiplas queries):
    /*
    const { data: passivosCategoriaData, error: passivosCategoriaError } = await supabase
      .from('despesas')
      .select(`
        valor,
        categoria:categorias ( id, nome )
      `)
      .lte('data', dataReferencia);
    // ... processar passivosCategoriaData ...
    */

    return {
      dataReferencia,
      totalAtivos,
      totalPassivos,
      patrimonioLiquido,
      // detalhes: { ... } // Adicionar detalhes aqui se implementado
    };

  } catch (error) {
    console.error('Erro geral ao calcular balanço patrimonial:', error);
    // Retorna um estado de erro ou valores zerados
    return {
      dataReferencia,
      totalAtivos: 0,
      totalPassivos: 0,
      patrimonioLiquido: 0,
    };
    // Ou relança o erro: throw error;
  }
}; 