# Diretrizes de Manipulação de Fuso Horário

Este documento fornece orientações sobre como trabalhar corretamente com datas e horários no sistema, garantindo consistência em todo o projeto.

## Regra Geral

**O sistema DEVE sempre exibir datas e horários no fuso horário do Brasil (America/Sao_Paulo, UTC-3).**

## Constantes do Sistema

Use sempre as constantes definidas em `src/lib/constants.ts`:

```typescript
// Constantes de fuso horário
export const TIMEZONE = 'America/Sao_Paulo';
export const TIMEZONE_OFFSET = '-03:00'; // Horário de Brasília
```

## Armazenamento de Dados

1. O banco de dados armazena timestamps em UTC (padrão do Supabase)
2. Para datas (sem hora), sempre use o formato `YYYY-MM-DD` considerando o calendário do Brasil
3. Para a coluna `data` em `movimentos_caixa`, certifique-se de usar o formato `YYYY-MM-DD` do Brasil

## Hook Utilitário

Use o hook `useDateTimeBR` para todas as operações de data/hora:

```typescript
const { 
  formatDateBR,         // Formata data UTC para exibição no Brasil
  formatDateTimeBR,     // Formata data e hora UTC para exibição no Brasil
  toLocalTime,          // Converte UTC para horário Brasil
  toUTC,                // Converte horário Brasil para UTC
  getLocalDateString,   // Extrai parte da data no formato brasileiro
  brStringToISO,        // Converte string formato BR para ISO UTC
} = useDateTimeBR();
```

## Manipulação em Serviços

1. Ao criar endpoints ou serviços, documente claramente o formato de data esperado
2. Ao salvar no banco de dados, converta datas para YYYY-MM-DD no fuso correto
3. Ao buscar do banco, certifique-se de converter para exibição no fuso brasileiro

## Formulários e Entrada de Dados

1. Ao coletar datas em formulários, assuma que são no fuso horário do Brasil
2. Converta para UTC apenas ao salvar no banco de dados
3. Use sempre validação de data para garantir formato correto

## Exemplos práticos

### Salvando uma nova venda:

```typescript
// Data de venda informada pelo usuário (já está no fuso Brasil)
const dataVendaInformada = '03/05/2025';
const dataVendaISO = brStringToISO(dataVendaInformada); // Converte para ISO UTC

// Ao salvar no banco
await supabase.from('vendas').insert({
  data_venda: dataVendaISO,
  // outros campos...
});
```

### Exibindo uma data:

```typescript
// Data vinda do banco (em UTC)
const dataVendaUTC = venda.data_venda; // '2025-05-03T15:00:00Z'
const dataFormatada = formatDateBR(dataVendaUTC); // '03/05/2025'
```

## Depuração

Ao debugar problemas de fuso horário, sempre verifique:

1. Se as datas armazenadas no banco estão em UTC
2. Se as datas exibidas estão sendo convertidas para horário brasileiro
3. Se há conversões inconsistentes em diferentes partes do código
4. Use os logs de debug para acompanhar o fluxo de conversão

---

Seguindo estas diretrizes, evitamos problemas de inconsistência de fuso horário em todo o sistema. 