import { FieldMapping } from "@/pages/ImportLeads";

// Lista de campos que devem ser ignorados automaticamente na importação
export const IGNORED_COLUMNS = [
  '_rownumber',
  'rownumber',
  'row number',
  'criado por',
  'created by',
  'criadoem',
  'criado em',
  'created at',
  'base de dados',
  'base de dados:',
  'proprietario',
  'proprietario:',
  'ultima atualizacao',
  'ultima atualizacao do funil',
  'última atualização',
  'última atualização do funil',
  'semana',
  'week',
  'agendamentos',
  'related agendamentos',
  'dados basicos',
  'dados básicos',
  'contatos',
  'total recomendacoes semana',
  'total_recomendacoes_semana',
  'total recomendacoes semana usuario',
  'total_recomendacoes_semana_usuario',
  'celularformatowhatsapp',
  'celular formato whatsapp',
  'data extraida',
  'data_extraida',
  'ddmmyyyy',
  'ranking semanal',
  'pontuacao',
  'pontuação',
  'probabilidade',
  'probabilidade ance',
  'probabilidade (ance)',
  'chance',
  'chance ance',
  'chance (ance)',
  'sitplanaction',
  'sitplan action',
  'joint nome do usuario',
  'joint nome do usuário',
  'link da reuniao',
  'link da reunião',
  'endereco da reuniao',
  'endereço da reunião',
  'tipo de reuniao',
  'tipo de reunião',
  'proxima reuniao',
  'próxima reunião',
  'ultimo contato',
  'último contato',
  'retornar em',
  'retornar em (data)',
];

// Função para normalizar texto para comparação
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .trim();
}

// Verifica se uma coluna deve ser ignorada
export function shouldIgnoreColumn(columnName: string): boolean {
  const normalized = normalizeText(columnName);
  return IGNORED_COLUMNS.some(ignored => 
    normalized === normalizeText(ignored) || 
    normalized.includes(normalizeText(ignored))
  );
}

// Verifica se os valores da coluna parecem ser metadata do sistema
export function isMetadataColumn(values: any[]): boolean {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 10);
  if (nonEmptyValues.length === 0) return false;

  // Se todos os valores são iguais e parecem emails, é metadata
  const uniqueValues = [...new Set(nonEmptyValues.map(v => String(v).toLowerCase()))];
  if (uniqueValues.length === 1 && String(uniqueValues[0]).includes('@')) {
    return true;
  }

  // Se os valores são números sequenciais, é metadata
  const allNumbers = nonEmptyValues.every(v => !isNaN(Number(v)));
  if (allNumbers) {
    const numbers = nonEmptyValues.map(v => Number(v)).sort((a, b) => a - b);
    const isSequential = numbers.every((num, idx) => idx === 0 || num === numbers[idx - 1] + 1);
    if (isSequential && numbers.length > 3) return true;
  }

  return false;
}

// Definição dos campos do sistema com categorias para organização
export const FIELD_CATEGORIES = {
  'Dados Pessoais': ['nome', 'idade', 'data_nascimento', 'casado', 'nome_esposa'],
  'Contato': ['telefone', 'celular_secundario', 'email', 'cidade'],
  'Profissional': ['profissao', 'empresa', 'renda_estimada'],
  'Família': ['tem_filhos', 'quantidade_filhos', 'nome_filhos', 'data_nascimento_filhos'],
  'Comercial': ['etapa', 'status', 'pa_estimado', 'pa_valor', 'valor', 'high_ticket', 'recomendante'],
  'Outros': ['observacoes', 'data_callback', 'avisado']
};

// Definição completa dos campos do sistema com todas as variações possíveis
export const FIELD_MAPPINGS: Record<string, { synonyms: string[]; required: boolean; dataType: string; description: string }> = {
  // Dados Pessoais
  nome: {
    synonyms: ['nome', 'name', 'cliente', 'lead', 'lead name', 'full name', 'nome completo', 'razao social', 'razão social'],
    required: true,
    dataType: 'text',
    description: 'Nome completo do lead'
  },
  idade: {
    synonyms: ['idade', 'age', 'anos'],
    required: false,
    dataType: 'number',
    description: 'Idade do lead'
  },
  data_nascimento: {
    synonyms: ['data nascimento', 'birth date', 'nascimento', 'aniversario', 'aniversário', 'data nasc', 'dt nascimento', 'dob', 'birthday'],
    required: false,
    dataType: 'date',
    description: 'Data de nascimento'
  },
  casado: {
    synonyms: ['casado', 'married', 'estado civil', 'matrimonio', 'matrimônio', 'casado(a)', 'casada'],
    required: false,
    dataType: 'boolean',
    description: 'Se é casado(a)'
  },
  nome_esposa: {
    synonyms: ['nome esposa', 'esposa', 'conjuge', 'cônjuge', 'nome conjuge', 'nome cônjuge', 'esposo', 'nome esposo', 'parceiro', 'parceira'],
    required: false,
    dataType: 'text',
    description: 'Nome do cônjuge'
  },

  // Contato
  telefone: {
    synonyms: ['telefone', 'phone', 'celular', 'mobile', 'whatsapp', 'fone', 'tel', 'numero', 'número', 'contato', 'celular principal'],
    required: false,
    dataType: 'phone',
    description: 'Telefone principal'
  },
  celular_secundario: {
    synonyms: ['celular secundario', 'celular secundário', 'segundo telefone', 'telefone 2', 'secondary phone', 'tel 2', 'celular 2', 'celular secundário ou número estrangeiro', 'numero estrangeiro', 'número estrangeiro'],
    required: false,
    dataType: 'phone',
    description: 'Telefone secundário'
  },
  email: {
    synonyms: ['email', 'e-mail', 'mail', 'correio', 'contato email', 'email address'],
    required: false,
    dataType: 'email',
    description: 'Endereço de e-mail'
  },
  cidade: {
    synonyms: ['cidade', 'city', 'local', 'localidade', 'municipio', 'município', 'uf', 'estado'],
    required: false,
    dataType: 'text',
    description: 'Cidade de residência'
  },

  // Profissional
  profissao: {
    synonyms: ['profissao', 'profissão', 'profession', 'job', 'ocupacao', 'ocupação', 'cargo', 'funcao', 'função', 'trabalho', 'atividade', 'ramo de atividade'],
    required: false,
    dataType: 'text',
    description: 'Profissão ou ocupação'
  },
  empresa: {
    synonyms: ['empresa', 'company', 'organizacao', 'organização', 'empregador', 'trabalha', 'firma', 'local de trabalho'],
    required: false,
    dataType: 'text',
    description: 'Empresa onde trabalha'
  },
  renda_estimada: {
    synonyms: ['renda', 'renda estimada', 'income', 'salario', 'salário', 'ganho', 'receita', 'renda mensal', 'faturamento'],
    required: false,
    dataType: 'currency',
    description: 'Renda estimada'
  },

  // Família
  tem_filhos: {
    synonyms: ['filhos', 'children', 'tem filhos', 'kids', 'possui filhos', 'tem filho'],
    required: false,
    dataType: 'boolean',
    description: 'Se possui filhos'
  },
  quantidade_filhos: {
    synonyms: ['quantidade filhos', 'numero filhos', 'número filhos', 'qtd filhos', 'number of children', 'num filhos', 'quantos filhos'],
    required: false,
    dataType: 'number',
    description: 'Quantidade de filhos'
  },
  nome_filhos: {
    synonyms: ['nome filhos', 'nomes filhos', 'nome dos filhos', 'filhos nomes', 'children names', 'nome filho'],
    required: false,
    dataType: 'text',
    description: 'Nomes dos filhos'
  },
  data_nascimento_filhos: {
    synonyms: ['data nascimento filhos', 'aniversario filhos', 'aniversário filhos', 'nascimento filhos', 'dt nasc filhos', 'filhos aniversario'],
    required: false,
    dataType: 'text',
    description: 'Datas de nascimento dos filhos'
  },

  // Comercial
  etapa: {
    synonyms: ['etapa', 'etapa funil', 'stage', 'fase', 'situacao', 'situação', 'pipeline', 'funil'],
    required: false,
    dataType: 'text',
    description: 'Etapa no funil de vendas'
  },
  status: {
    synonyms: ['status', 'estado', 'condition', 'situacao atual', 'situação atual', 'state'],
    required: false,
    dataType: 'text',
    description: 'Status do lead'
  },
  pa_estimado: {
    synonyms: ['pa estimado', 'premio anual', 'prêmio anual', 'pa', 'premio estimado', 'prêmio estimado'],
    required: false,
    dataType: 'currency',
    description: 'Prêmio Anual estimado'
  },
  pa_valor: {
    synonyms: ['pa valor', 'premio valor', 'prêmio valor', 'valor premio', 'valor prêmio', 'valor pa'],
    required: false,
    dataType: 'currency',
    description: 'Valor do Prêmio Anual'
  },
  valor: {
    synonyms: ['valor', 'value', 'preco', 'preço', 'price', 'montante', 'total'],
    required: false,
    dataType: 'currency',
    description: 'Valor da oportunidade'
  },
  high_ticket: {
    synonyms: ['high ticket', 'highticket', 'ticket alto', 'premium', 'vip', 'alto valor'],
    required: false,
    dataType: 'boolean',
    description: 'Se é cliente high ticket'
  },
  recomendante: {
    synonyms: ['recomendante', 'recomendado por', 'indicado por', 'referencia', 'referência', 'indicacao', 'indicação', 'referral', 'referred by', 'quem indicou'],
    required: false,
    dataType: 'text',
    description: 'Quem recomendou o lead'
  },

  // Outros
  observacoes: {
    synonyms: ['observacoes', 'observações', 'notes', 'comments', 'remarks', 'obs', 'observacao', 'observação', 'comentarios', 'comentários', 'notas'],
    required: false,
    dataType: 'text',
    description: 'Observações gerais'
  },
  data_callback: {
    synonyms: ['data callback', 'callback', 'data retorno', 'retornar em', 'ligar em', 'agendar', 'ligar depois', 'data ligar'],
    required: false,
    dataType: 'date',
    description: 'Data para retornar contato'
  },
  avisado: {
    synonyms: ['avisado', 'notificado', 'contacted', 'avisado cliente', 'cliente avisado'],
    required: false,
    dataType: 'boolean',
    description: 'Se o cliente foi avisado'
  }
};

// Função para calcular similaridade entre strings
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  
  // Exact match
  if (norm1 === norm2) return 1.0;
  
  // Contains match
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
  
  // Levenshtein distance simplificado
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Função para detectar tipo de dados baseado em exemplos
function detectDataType(values: any[]): string {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 10);
  
  if (nonEmptyValues.length === 0) return 'text';
  
  // Verifica se é telefone
  const phonePattern = /^[\d\s\(\)\-\+]{8,}$/;
  const phoneCount = nonEmptyValues.filter(v => phonePattern.test(String(v))).length;
  if (phoneCount / nonEmptyValues.length > 0.7) return 'phone';
  
  // Verifica se é email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailCount = nonEmptyValues.filter(v => emailPattern.test(String(v))).length;
  if (emailCount / nonEmptyValues.length > 0.7) return 'email';
  
  // Verifica se é data
  const dateCount = nonEmptyValues.filter(v => {
    const date = new Date(String(v));
    return !isNaN(date.getTime()) && String(v).match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/);
  }).length;
  if (dateCount / nonEmptyValues.length > 0.7) return 'date';
  
  // Verifica se é número
  const numberCount = nonEmptyValues.filter(v => !isNaN(Number(String(v).replace(/[^\d.-]/g, '')))).length;
  if (numberCount / nonEmptyValues.length > 0.7) return 'number';
  
  // Verifica se é moeda
  const currencyPattern = /^[\d\.\,\s]*[\d][\s]*[R\$]*$/;
  const currencyCount = nonEmptyValues.filter(v => 
    currencyPattern.test(String(v)) || String(v).includes('R$') || String(v).includes('$')
  ).length;
  if (currencyCount / nonEmptyValues.length > 0.5) return 'currency';
  
  // Verifica se é boolean
  const booleanValues = ['sim', 'não', 'yes', 'no', 'true', 'false', '1', '0', 's', 'n'];
  const booleanCount = nonEmptyValues.filter(v => 
    booleanValues.includes(normalizeText(String(v)))
  ).length;
  if (booleanCount / nonEmptyValues.length > 0.7) return 'boolean';
  
  return 'text';
}

// Função principal para gerar mapeamentos automáticos
export function generateFieldMappings(headers: string[], sampleData?: any[][]): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  
  headers.forEach((header, index) => {
    // Verificar se a coluna deve ser ignorada
    if (shouldIgnoreColumn(header)) {
      mappings.push({
        sourceColumn: header,
        targetField: '',
        confidence: 0
      });
      return;
    }

    // Verificar se os dados parecem ser metadata
    if (sampleData && sampleData.length > 0) {
      const columnValues = sampleData.map(row => row[index]);
      if (isMetadataColumn(columnValues)) {
        mappings.push({
          sourceColumn: header,
          targetField: '',
          confidence: 0
        });
        return;
      }
    }

    let bestMatch = '';
    let bestConfidence = 0;
    
    // Detectar tipo de dados se houver dados de exemplo
    let detectedType = 'text';
    if (sampleData && sampleData.length > 0) {
      const columnValues = sampleData.map(row => row[index]);
      detectedType = detectDataType(columnValues);
    }
    
    // Encontrar o melhor campo correspondente
    Object.entries(FIELD_MAPPINGS).forEach(([fieldKey, fieldConfig]) => {
      fieldConfig.synonyms.forEach(synonym => {
        const similarity = calculateSimilarity(header, synonym);
        
        // Bonus por tipo de dados compatível
        let typeBonus = 0;
        if (detectedType === fieldConfig.dataType) {
          typeBonus = 0.2;
        } else if (
          (detectedType === 'text' && fieldConfig.dataType === 'text') ||
          (detectedType === 'number' && ['number', 'currency'].includes(fieldConfig.dataType))
        ) {
          typeBonus = 0.1;
        }
        
        const finalConfidence = Math.min(1.0, similarity + typeBonus);
        
        if (finalConfidence > bestConfidence && finalConfidence > 0.6) {
          bestMatch = fieldKey;
          bestConfidence = finalConfidence;
        }
      });
    });
    
    mappings.push({
      sourceColumn: header,
      targetField: bestMatch || '',
      confidence: bestConfidence
    });
  });
  
  return mappings;
}

// Função para validar dados importados
export function validateImportedData(data: any[], mappings: FieldMapping[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verificar se há campos obrigatórios mapeados
  const requiredFields = Object.entries(FIELD_MAPPINGS)
    .filter(([_, config]) => config.required)
    .map(([key, _]) => key);
  
  const mappedFields = mappings.filter(m => m.targetField).map(m => m.targetField);
  
  requiredFields.forEach(field => {
    if (!mappedFields.includes(field)) {
      errors.push(`Campo obrigatório "${field}" não foi mapeado`);
    }
  });
  
  // Verificar qualidade dos dados
  const nameMapping = mappings.find(m => m.targetField === 'nome');
  if (nameMapping) {
    const nameColumnIndex = mappings.indexOf(nameMapping);
    const emptyNames = data.filter(row => !row[nameColumnIndex] || String(row[nameColumnIndex]).trim() === '').length;
    
    if (emptyNames > 0) {
      warnings.push(`${emptyNames} registros com nome vazio serão ignorados`);
    }
  }

  // Verificar campos ignorados
  const ignoredCount = mappings.filter(m => !m.targetField).length;
  if (ignoredCount > 0) {
    warnings.push(`${ignoredCount} colunas não serão importadas (sem mapeamento)`);
  }
  
  return { errors, warnings };
}

// Função para converter dados importados para formato do banco
export function convertImportedData(data: any[][], mappings: FieldMapping[]): any[] {
  return data.map(row => {
    const convertedRow: any = {};
    
    mappings.forEach((mapping, index) => {
      if (mapping.targetField && row[index] !== undefined && row[index] !== null && row[index] !== '') {
        const value = String(row[index]).trim();
        const fieldConfig = FIELD_MAPPINGS[mapping.targetField as keyof typeof FIELD_MAPPINGS];
        
        if (fieldConfig) {
          convertedRow[mapping.targetField] = convertValue(value, fieldConfig.dataType);
        }
      }
    });
    
    return convertedRow;
  }).filter(row => row.nome); // Filtrar apenas registros com nome
}

function convertValue(value: string, dataType: string): any {
  switch (dataType) {
    case 'phone':
      // Converte para string primeiro para lidar com números grandes
      const valueStr = String(value);
      // Remove apenas caracteres não numéricos, preservando todos os dígitos
      const phoneDigits = valueStr.replace(/\D/g, '');
      return phoneDigits || null;
    
    case 'email':
      return value.toLowerCase();
    
    case 'number':
      const num = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? null : num;
    
    case 'currency':
      const currency = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(currency) ? null : currency.toString();
    
    case 'boolean':
      const normalized = normalizeText(value);
      return ['sim', 'yes', 'true', '1', 's'].includes(normalized);
    
    case 'date':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      } catch {
        return null;
      }
    
    default:
      return value;
  }
}

// Função para mapear etapas da planilha para valores válidos do enum
export function mapEtapaToEnum(etapa: string): string {
  if (!etapa) return 'Novo';
  
  const etapaNormalizada = normalizeText(etapa);
  
  // Mapeamento das etapas mais comuns baseado nas etapas válidas do sistema
  const etapaMap: { [key: string]: string } = {
    'novo': 'Novo',
    'new': 'Novo',
    'todos': 'Todos',
    'all': 'Todos',
    'ta': 'TA',
    'oi': 'OI',
    'delay oi': 'Delay OI',
    'delayoi': 'Delay OI',
    'pc': 'PC',
    'delay pc': 'Delay PC',
    'delaypc': 'Delay PC',
    'c2': 'C2',
    'delay c2': 'Delay C2',
    'delayc2': 'Delay C2',
    'n': 'N',
    'nao': 'Não',
    'não': 'Não',
    'no': 'Não',
    'nao atendido': 'Não Atendido',
    'não atendido': 'Não Atendido',
    'nao atendeu': 'Não Atendido',
    'não atendeu': 'Não Atendido',
    'ligar depois': 'Ligar Depois',
    'callback': 'Ligar Depois',
    'reagendar': 'Ligar Depois',
    'marcar': 'Marcar',
    'apolice emitida': 'Apólice Emitida',
    'apólice emitida': 'Apólice Emitida',
    'apolice entregue': 'Apólice Entregue',
    'apólice entregue': 'Apólice Entregue',
    'proposta cancelada': 'Proposta Cancelada',
    'apolice cancelada': 'Apólice Cancelada',
    'apólice cancelada': 'Apólice Cancelada',
    'analisando proposta': 'Analisando Proposta',
    'pendencia de uw': 'Pendência de UW',
    'pendência de uw': 'Pendência de UW',
    'placed': 'Placed',
    'proposta nao apresentada': 'Proposta Não Apresentada',
    'proposta não apresentada': 'Proposta Não Apresentada'
  };
  
  return etapaMap[etapaNormalizada] || 'Novo';
}

// Função para determinar a etapa final priorizando status sobre etapa
export function determineEtapaFinal(etapa?: string, status?: string): string {
  // Se existe status, ele tem prioridade
  if (status && status.trim()) {
    const etapaFromStatus = mapEtapaToEnum(status);
    // Se o status foi mapeado para algo diferente de 'Novo', usa ele
    if (etapaFromStatus !== 'Novo' || normalizeText(status) === 'novo') {
      return etapaFromStatus;
    }
  }
  
  // Caso contrário, usa a etapa
  return mapEtapaToEnum(etapa || '');
}

// Gerar dados para planilha modelo
export function generateTemplateData(): { headers: string[]; examples: any[][] } {
  const headers = Object.keys(FIELD_MAPPINGS);
  const examples = [
    ['João Silva', 35, '1989-05-15', 'Sim', 'Maria Silva', '11999887766', '11888776655', 'joao@email.com', 'São Paulo', 'Empresário', 'Tech Corp', 'R$ 15.000', 'Sim', 2, 'Pedro, Ana', '2020-01-15, 2022-06-20', 'OI', 'Ativo', 'R$ 5.000', 'R$ 4.800', 'R$ 50.000', 'Sim', 'Carlos Santos', 'Cliente muito interessado', '2025-01-15', 'Sim'],
    ['Ana Souza', 42, '1982-11-22', 'Não', '', '21988776655', '', 'ana@email.com', 'Rio de Janeiro', 'Médica', 'Hospital ABC', 'R$ 25.000', 'Não', 0, '', '', 'PC', 'Negociando', 'R$ 8.000', 'R$ 7.500', 'R$ 80.000', 'Sim', 'Maria Oliveira', 'Aguardando retorno', '', 'Não']
  ];
  
  return { headers, examples };
}
