// Mapeamento centralizado de cores para todas as etapas do funil
// Usado em badges, gráficos e componentes de métricas

export const STAGE_COLORS = {
  // Badge classes (para componentes Tailwind)
  badge: {
    'Todos': 'bg-blue-500',
    'Novo': 'bg-sky-500',
    'TA': 'bg-purple-600',
    'Não atendido': 'bg-zinc-500',
    'Ligar Depois': 'bg-red-600',
    'Marcar': 'bg-orange-500',
    'OI': 'bg-indigo-500',
    'Delay OI': 'bg-yellow-500',
    'PC': 'bg-amber-500',
    'Delay PC': 'bg-red-500',
    'Analisando Proposta': 'bg-orange-600',
    'Pendência de UW': 'bg-yellow-700',
    'C2': 'bg-pink-500',
    'Proposta Não Apresentada': 'bg-gray-600',
    'N': 'bg-purple-500',
    'Proposta Cancelada': 'bg-red-700',
    'Apólice Emitida': 'bg-green-500',
    'Apólice Entregue': 'bg-emerald-600',
    'Placed': 'bg-teal-500',
    'Persistência': 'bg-amber-600',
    'Não': 'bg-gray-500',
    'Apólice Cancelada': 'bg-red-800',
    // TA Actions
    'NAO_ATENDIDO': 'bg-zinc-500',
    'LIGAR_DEPOIS': 'bg-red-600',
    'MARCAR': 'bg-orange-500',
    'NAO_TEM_INTERESSE': 'bg-purple-500',
  },
  // Hex colors (para gráficos/recharts)
  hex: {
    'Todos': '#3b82f6',
    'Novo': '#0ea5e9',
    'TA': '#9333ea',
    'Não atendido': '#71717a',
    'Ligar Depois': '#dc2626',
    'Marcar': '#f97316',
    'OI': '#6366f1',
    'Delay OI': '#eab308',
    'PC': '#f59e0b',
    'Delay PC': '#ef4444',
    'Analisando Proposta': '#ea580c',
    'Pendência de UW': '#a16207',
    'C2': '#ec4899',
    'Proposta Não Apresentada': '#52525b',
    'N': '#a855f7',
    'Proposta Cancelada': '#b91c1c',
    'Apólice Emitida': '#22c55e',
    'Apólice Entregue': '#059669',
    'Placed': '#14b8a6',
    'Persistência': '#d97706',
    'Não': '#6b7280',
    'Apólice Cancelada': '#991b1b',
    // TA Actions
    'NAO_ATENDIDO': '#71717a',
    'LIGAR_DEPOIS': '#dc2626',
    'MARCAR': '#f97316',
    'NAO_TEM_INTERESSE': '#a855f7',
  }
} as const;

export const getEtapaColor = (etapa: string): string => {
  return STAGE_COLORS.badge[etapa as keyof typeof STAGE_COLORS.badge] || 'bg-gray-500';
};

export const getEtapaHex = (etapa: string): string => {
  return STAGE_COLORS.hex[etapa as keyof typeof STAGE_COLORS.hex] || '#6b7280';
};

// Cores para métricas do TA Dashboard
export const TA_METRIC_COLORS = {
  contactados: { badge: 'bg-blue-500', hex: '#3b82f6' },
  naoAtendido: { badge: 'bg-zinc-500', hex: '#71717a' },
  ligarDepois: { badge: 'bg-red-600', hex: '#dc2626' },
  marcar: { badge: 'bg-orange-500', hex: '#f97316' },
  naoTemInteresse: { badge: 'bg-purple-500', hex: '#a855f7' },
  oi: { badge: 'bg-indigo-500', hex: '#6366f1' },
} as const;
