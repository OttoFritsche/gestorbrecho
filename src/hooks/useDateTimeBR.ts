import { useMemo } from 'react';
import { format, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { utcToZonedTime, zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/constants';

/**
 * Hook para padronizar manipulação de datas no fuso horário do Brasil.
 * Provê funções úteis para converter entre UTC e horário brasileiro,
 * formatar datas de forma consistente em toda a aplicação,
 * e trabalhar com strings ISO.
 */
export const useDateTimeBR = () => {
  const utils = useMemo(() => {
    return {
      /**
       * Converte uma data UTC para o fuso horário do Brasil
       */
      toLocalTime: (utcDate: Date | string): Date => {
        if (!utcDate) return new Date();
        const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
        return utcToZonedTime(dateObj, TIMEZONE);
      },

      /**
       * Converte uma data no fuso horário Brasil para UTC
       */
      toUTC: (localDate: Date | string): Date => {
        if (!localDate) return new Date();
        const dateObj = typeof localDate === 'string' ? parseISO(localDate) : localDate;
        return zonedTimeToUtc(dateObj, TIMEZONE);
      },

      /**
       * Formata uma data UTC para exibição no formato brasileiro
       * @param date Data UTC (ISO string ou objeto Date)
       * @param formatStr String de formato (padrão: dd/MM/yyyy)
       */
      formatDateBR: (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
        try {
          if (!date) return '-';
          const dateObj = typeof date === 'string' ? parseISO(date) : date;
          const localDate = utcToZonedTime(dateObj, TIMEZONE);
          return format(localDate, formatStr, { locale: ptBR });
        } catch (error) {
          console.error('Erro ao formatar data:', error);
          return 'Data inválida';
        }
      },

      /**
       * Formata um timestamp UTC para exibição no formato brasileiro com hora
       * @param date Data UTC (ISO string ou objeto Date)
       * @param formatStr String de formato (padrão: dd/MM/yyyy HH:mm)
       */
      formatDateTimeBR: (date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm'): string => {
        try {
          if (!date) return '-';
          const dateObj = typeof date === 'string' ? parseISO(date) : date;
          const localDate = utcToZonedTime(dateObj, TIMEZONE);
          return format(localDate, formatStr, { locale: ptBR });
        } catch (error) {
          console.error('Erro ao formatar data e hora:', error);
          return 'Data/hora inválida';
        }
      },

      /**
       * Extrai apenas a parte da data (YYYY-MM-DD) de uma data UTC
       */
      getLocalDateString: (utcDate: Date | string): string => {
        try {
          if (!utcDate) return '';
          const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
          return formatInTimeZone(dateObj, TIMEZONE, 'yyyy-MM-dd');
        } catch (error) {
          console.error('Erro ao extrair data local:', error);
          return '';
        }
      },

      /**
       * Converte uma data para string ISO 8601 com o timezone do Brasil
       * Ex: 2024-05-07T21:00:00-03:00
       */
      toISOStringWithTZ: (date: Date | string): string => {
        try {
          if (!date) return '';
          const dateObj = typeof date === 'string' ? parseISO(date) : date;
          return formatInTimeZone(dateObj, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        } catch (error) {
          console.error('Erro ao converter para ISO com timezone:', error);
          return '';
        }
      },

      /**
       * Verifica se uma string é uma data válida no formato brasileiro
       */
      isValidDateString: (dateStr: string, formatStr: string = 'dd/MM/yyyy'): boolean => {
        try {
          if (!dateStr) return false;
          parse(dateStr, formatStr, new Date());
          return true;
        } catch {
          return false;
        }
      },

      /**
       * Converte uma string de data formatada no BR para ISO UTC
       */
      brStringToISO: (dateStr: string, formatStr: string = 'dd/MM/yyyy'): string => {
        try {
          // Parse com o formato brasileiro
          const parsedDate = parse(dateStr, formatStr, new Date());
          // Assume meio-dia para evitar problemas de fuso
          const midday = new Date(
            parsedDate.getFullYear(),
            parsedDate.getMonth(),
            parsedDate.getDate(),
            12, 0, 0
          );
          // Retorna ISO string
          return midday.toISOString();
        } catch (error) {
          console.error('Erro ao converter string BR para ISO:', error);
          return '';
        }
      }
    };
  }, []);

  return utils;
};

export default useDateTimeBR; 