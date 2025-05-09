/**
 * Interface que representa uma Regra de Comissão conforme a tabela public.regras_comissao
 */
export interface RegraComissao {
  id: string;                      // UUID (PK)
  nome: string;                    // TEXT NOT NULL
  descricao?: string | null;       // TEXT NULLABLE
  tipo_calculo: 'porcentagem' | 'valor_fixo'; // TEXT NOT NULL (Adicionar outros tipos se suportados)
  valor: number;                   // NUMERIC NOT NULL
  ativa: boolean;                  // BOOLEAN NOT NULL DEFAULT true
  periodo_vigencia_inicio?: string | null; // DATE NULLABLE (Formato YYYY-MM-DD)
  periodo_vigencia_fim?: string | null;    // DATE NULLABLE (Formato YYYY-MM-DD)
  created_at: string;              // TIMESTAMPTZ NOT NULL
  updated_at: string;              // TIMESTAMPTZ NOT NULL
}

/**
 * Tipo para os dados de entrada ao criar ou atualizar uma Regra de Comissão.
 * Omitimos campos gerenciados pelo banco (id, created_at, updated_at).
 */
export type RegraComissaoInput = Omit<RegraComissao, 'id' | 'created_at' | 'updated_at'>; 