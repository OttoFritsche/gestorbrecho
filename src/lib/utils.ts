import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number | null | undefined) => {
  // Verificar se o valor é válido (não é null, undefined ou NaN)
  const validValue = value !== null && value !== undefined && !isNaN(value) ? value : 0;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', 
    currency: 'BRL'
  }).format(validValue);
}

export const formatDate = (date: string | Date | null | undefined, includeTime: boolean = false) => {
  // Verifica se a data é nula, undefined ou inválida
  if (date === null || date === undefined || date === '') {
    return '-';
  }
  
  try {
    const dateObject = date instanceof Date ? date : new Date(date);
    
    // Verifica se a data é válida (não é NaN)
    if (isNaN(dateObject.getTime())) {
      return '-';
    }
    
    // Opções de formatação com timezone do Brasil
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo' // Garante que a data seja exibida no fuso horário do Brasil
    };
    
    // Adiciona informações de hora se solicitado
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }
    
    return new Intl.DateTimeFormat('pt-BR', options).format(dateObject);
  } catch (error) {
    console.warn('Erro ao formatar data:', date);
    return '-';
  }
}

export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formata um valor para exibição no formato de moeda brasileira (R$)
 * @param value - O valor a ser formatado (string ou número)
 * @returns String formatada no padrão monetário brasileiro
 */
export const formatCurrencyInput = (value: string | number): string => {
  // Se for string vazia, null ou undefined
  if (!value) {
    return '';
  }

  // Verifica se o valor é um objeto - proteção contra erros
  if (typeof value === 'object') {
    console.warn('formatCurrencyInput recebeu um objeto em vez de string/number:', value);
    return '';
  }

  // Se for string, remove caracteres não numéricos e converte para número
  let numberValue = 0;
  
  if (typeof value === 'string') {
    // Remove tudo que não for dígito
    const digits = value.replace(/\D/g, '');
    
    // Se não houver dígitos, retorna vazio
    if (digits === '') {
      return '';
    }
    
    // Converte para centavos e depois para reais
    numberValue = parseInt(digits, 10) / 100;
  } else {
    // Se já for número
    numberValue = value;
  }

  // Formata para exibição no padrão BRL
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

/**
 * Valida se um CPF é válido
 * @param cpf - O CPF a ser validado (apenas dígitos)
 * @returns Boolean indicando se o CPF é válido
 */
export function isValidCPF(cpf: string): boolean {
  // Verifica se o CPF tem 11 dígitos
  if (cpf.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CPF inválido, mas passa na validação do algoritmo)
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;

  // Cálculo do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cpf.substring(9, 10))) {
    return false;
  }

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cpf.substring(10, 11))) {
    return false;
  }

  return true;
}

/**
 * Valida se um CNPJ é válido
 * @param cnpj - O CNPJ a ser validado (apenas dígitos)
 * @returns Boolean indicando se o CNPJ é válido
 */
export function isValidCNPJ(cnpj: string): boolean {
  // Verifica se o CNPJ tem 14 dígitos
  if (cnpj.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CNPJ inválido, mas passa na validação do algoritmo)
  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  // Cálculo do primeiro dígito verificador
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return false;
  }

  // Cálculo do segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return false;
  }

  return true;
}

/**
 * Formata um CPF ou CNPJ com a máscara adequada
 * @param value - O CPF ou CNPJ a ser formatado (apenas dígitos)
 * @returns String formatada como CPF (XXX.XXX.XXX-XX) ou CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCPFOrCNPJ(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, '');
  
  // Formata como CPF
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } 
  // Formata como CNPJ
  else {
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
}

// Alias para compatibilidade com código existente
export const formatarData = formatDate;
