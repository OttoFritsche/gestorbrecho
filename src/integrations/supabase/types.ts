Need to install the following packages:
supabase@2.22.6

export type Tables<T extends string> = any;

// Definição básica do tipo Database para corrigir os erros de tipagem
export interface Database {
  public: {
    Tables: {
      vendas: {
        Row: any;
        Insert: any;
        Update: any;
      };
      vendas_items: {
        Row: any;
        Insert: any;
        Update: any;
      };
      clientes: {
        Row: any;
        Insert: any;
        Update: any;
      };
      formas_pagamento: {
        Row: any;
        Insert: any;
        Update: any;
      };
      produtos: {
        Row: any;
        Insert: any;
        Update: any;
      };
      categorias: {
        Row: any;
        Insert: any;
        Update: any;
      };
      despesas: {
        Row: any;
        Insert: any;
        Update: any;
      };
      receitas: {
        Row: any;
        Insert: any;
        Update: any;
      };
      movimentos_caixa: {
        Row: any;
        Insert: any;
        Update: any;
      };
      fluxo_caixa: {
        Row: any;
        Insert: any;
        Update: any;
      };
      metas: {
        Row: any;
        Insert: any;
        Update: any;
      };
      progresso_meta: {
        Row: any;
        Insert: any;
        Update: any;
      };
      alertas: {
        Row: any;
        Insert: any;
        Update: any;
      };
      configuracoes_alerta: {
        Row: any;
        Insert: any;
        Update: any;
      };
      pagamentos_prazo: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
    Views: {
      [key: string]: {
        Row: any;
      };
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
  };
}
