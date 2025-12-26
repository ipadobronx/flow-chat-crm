import { z } from 'zod';
import { sanitizeText } from './validation';

/**
 * Shared validation schemas for database operations
 */

export const updateLeadSchema = z.object({
  nome: z.string().min(2).max(100).optional().transform(sanitizeText),
  empresa: z.string().max(100).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  valor: z.string().optional().nullable().refine(
    val => !val || /^\d+(\.\d{1,2})?$/.test(val),
    'Valor deve ser um número válido'
  ),
  telefone: z.string().optional().nullable().refine(
    val => !val || val.length >= 10,
    'Telefone inválido'
  ),
  profissao: z.string().max(100).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  observacoes: z.string().max(2000).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  pa_estimado: z.string().max(100).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  celular_secundario: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  cidade: z.string().max(100).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  renda_estimada: z.string().max(50).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  etapa: z.enum([
    'Todos', 'Novo', 'TA', 'Não atendido', 'OI', 'Delay OI',
    'PC', 'Delay PC', 'N', 'Apólice Emitida', 'Apólice Entregue',
    'C2', 'Ligar Depois', 'Marcar', 'Não',
    'Proposta Cancelada', 'Persistência', 'Analisando Proposta',
    'Pendência de UW', 'Placed', 'Proposta Não Apresentada'
  ]).optional(),
});

export const updateLeadPartialSchema = z.object({
  valor: z.string().optional().nullable().refine(
    val => !val || /^\d+(\.\d{1,2})?$/.test(val),
    'Valor inválido'
  ),
  observacoes: z.string().max(2000).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  pa_estimado: z.string().max(100).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  celular_secundario: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  idade: z.number().int().min(0).max(120).optional().nullable(),
  renda_estimada: z.string().max(50).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  cidade: z.string().max(100).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  profissao: z.string().max(100).optional().nullable().transform(val => val ? sanitizeText(val) : val),
  quantidade_filhos: z.number().int().min(0).max(20).optional().nullable(),
  etapa: z.enum([
    'Todos', 'Novo', 'TA', 'Não atendido', 'OI', 'Delay OI',
    'PC', 'Delay PC', 'N', 'Apólice Emitida', 'Apólice Entregue',
    'C2', 'Ligar Depois', 'Marcar', 'Não',
    'Proposta Cancelada', 'Persistência', 'Analisando Proposta',
    'Pendência de UW', 'Placed', 'Proposta Não Apresentada'
  ]).optional(),
  created_at: z.string().datetime().optional(),
  ta_order: z.number().int().min(0).optional().nullable(),
});

export const agendamentoSchema = z.object({
  data_agendamento: z.string().datetime('Data de agendamento inválida'),
  observacoes: z.string().max(500).optional().transform(sanitizeText),
  status: z.enum(['pendente', 'concluido', 'cancelado']).optional(),
});
