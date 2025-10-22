import { z } from 'zod';
import { sanitizeText } from './validation';

/**
 * Shared validation schemas for database operations
 */

export const updateLeadSchema = z.object({
  nome: z.string().min(2).max(100).optional().transform(sanitizeText),
  empresa: z.string().max(100).optional().transform(sanitizeText),
  valor: z.string().optional().refine(
    val => !val || /^\d+(\.\d{1,2})?$/.test(val),
    'Valor deve ser um número válido'
  ),
  telefone: z.string().optional().refine(
    val => !val || val.length >= 10,
    'Telefone inválido'
  ),
  profissao: z.string().max(100).optional().transform(sanitizeText),
  observacoes: z.string().max(2000).optional().transform(sanitizeText),
  pa_estimado: z.string().max(100).optional().transform(sanitizeText),
  celular_secundario: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cidade: z.string().max(100).optional().transform(sanitizeText),
  renda_estimada: z.string().max(50).optional().transform(sanitizeText),
  etapa: z.enum([
    'Todos', 'Novo', 'Ligar Depois', 'Tentativa', 'OI', 'Delay OI',
    'PC', 'Delay PC', 'N', 'Não', 'Apólice Emitida'
  ]).optional(),
});

export const updateLeadPartialSchema = z.object({
  valor: z.string().optional().refine(
    val => !val || /^\d+(\.\d{1,2})?$/.test(val),
    'Valor inválido'
  ),
  observacoes: z.string().max(2000).optional().transform(sanitizeText),
  pa_estimado: z.string().max(100).optional().transform(sanitizeText),
  etapa: z.enum([
    'Todos', 'Novo', 'Ligar Depois', 'Tentativa', 'OI', 'Delay OI',
    'PC', 'Delay PC', 'N', 'Não', 'Apólice Emitida'
  ]).optional(),
  created_at: z.string().datetime().optional(),
  ta_order: z.number().int().min(0).optional(),
});

export const agendamentoSchema = z.object({
  data_agendamento: z.string().datetime('Data de agendamento inválida'),
  observacoes: z.string().max(500).optional().transform(sanitizeText),
  status: z.enum(['pendente', 'concluido', 'cancelado']).optional(),
});
