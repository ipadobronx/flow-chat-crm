import { FieldMapping } from "@/pages/ImportLeads";

// Definição dos campos do sistema e suas variações possíveis
export const FIELD_MAPPINGS = {
  nome: {
    synonyms: ['nome', 'name', 'cliente', 'lead', 'lead name', 'full name', 'nome completo', 'razao social'],
    required: true,
    dataType: 'text'
  },
  telefone: {
    synonyms: ['telefone', 'phone', 'celular', 'mobile', 'whatsapp', 'fone', 'tel', 'numero', 'contato'],
    required: false,
    dataType: 'phone'
  },
  email: {
    synonyms: ['email', 'e-mail', 'mail', 'correio', 'contato email'],
    required: false,
    dataType: 'email'
  },
  idade: {
    synonyms: ['idade', 'age', 'anos'],
    required: false,
    dataType: 'number'
  },
  data_nascimento: {
    synonyms: ['data nascimento', 'birth date', 'nascimento', 'aniversario', 'data nasc', 'dt nascimento'],
    required: false,
    dataType: 'date'
  },
  profissao: {
    synonyms: ['profissao', 'profession', 'job', 'ocupacao', 'cargo', 'funcao', 'trabalho'],
    required: false,
    dataType: 'text'
  },
  cidade: {
    synonyms: ['cidade', 'city', 'local', 'localidade', 'municipio'],
    required: false,
    dataType: 'text'
  },
  renda_estimada: {
    synonyms: ['renda', 'income', 'salario', 'ganho', 'renda estimada', 'receita'],
    required: false,
    dataType: 'currency'
  },
  empresa: {
    synonyms: ['empresa', 'company', 'organizacao', 'empregador', 'trabalha'],
    required: false,
    dataType: 'text'
  },
  observacoes: {
    synonyms: ['observacoes', 'notes', 'comments', 'remarks', 'obs', 'observacao', 'comentarios'],
    required: false,
    dataType: 'text'
  },
  casado: {
    synonyms: ['casado', 'married', 'estado civil', 'matrimonio', 'conjuge'],
    required: false,
    dataType: 'boolean'
  },
  tem_filhos: {
    synonyms: ['filhos', 'children', 'tem filhos', 'kids'],
    required: false,
    dataType: 'boolean'
  },
  quantidade_filhos: {
    synonyms: ['quantidade filhos', 'numero filhos', 'qtd filhos', 'number of children'],
    required: false,
    dataType: 'number'
  },
  celular_secundario: {
    synonyms: ['celular secundario', 'segundo telefone', 'telefone 2', 'secondary phone'],
    required: false,
    dataType: 'phone'
  },
  pa_estimado: {
    synonyms: ['pa estimado', 'premio anual', 'pa', 'premio'],
    required: false,
    dataType: 'currency'
  },
  valor: {
    synonyms: ['valor', 'value', 'preco', 'price', 'montante'],
    required: false,
    dataType: 'currency'
  },
  recomendante: {
    synonyms: ['recomendante', 'recomendado por', 'indicado por', 'referencia', 'indicacao', 'referral', 'referred by'],
    required: false,
    dataType: 'text'
  },
  etapa: {
    synonyms: ['etapa', 'etapa funil', 'stage', 'fase', 'situacao'],
    required: false,
    dataType: 'text'
  },
  status: {
    synonyms: ['status', 'estado', 'condition', 'situacao atual'],
    required: false,
    dataType: 'text'
  }
};

// Função para normalizar texto para comparação
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .trim();
}

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
  
  // Mapeamento das etapas mais comuns
  const etapaMap: { [key: string]: string } = {
    'novo': 'Novo',
    'new': 'Novo',
    'todos': 'Todos',
    'all': 'Todos',
    'oi': 'OI',
    'delay oi': 'Delay OI',
    'delayoi': 'Delay OI',
    'pc': 'PC',
    'delay pc': 'Delay PC',
    'delaypc': 'Delay PC',
    'n': 'N',
    'nao': 'Não',
    'não': 'Não',
    'no': 'Não',
    'ligar depois': 'Ligar Depois',
    'callback': 'Ligar Depois',
    'reagendar': 'Ligar Depois'
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