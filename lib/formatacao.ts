import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatarDataHora(data: Date | string) {
  return format(new Date(data), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
}

export function formatarData(data: Date | string) {
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarNumero(valor: number, casas = 0) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
