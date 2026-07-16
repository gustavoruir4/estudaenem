// src/lib/materias.js
// Deriva a "matéria" (Física, Inglês, História...) a partir do campo `assunto`.
// Não altera os dados das questões — a matéria é calculada em tempo real.

const MAT_SUBTOPICS = new Set([
  'estatística', 'geometria espacial', 'geometria plana', 'matemática financeira',
  'probabilidade', 'funções', 'combinatória', 'álgebra', 'progressão geométrica',
  'trigonometria', 'inequações', 'razões e taxas', 'notação científica',
  'razões e proporções', 'logaritmos', 'progressão aritmética', 'operações numéricas',
  'frações e proporções', 'álgebra/matrizes', 'geometria',
])

const HUMANAS_MAP = {
  'geopolítica': 'Geografia',
  'antropologia': 'Sociologia',
  'economia': 'Geografia',
  'direito': 'Sociologia',
  'política': 'Sociologia',
  'educação': 'História',
}

export function derivarMateria(assunto, area) {
  if (!assunto) return area
  const primeiro = assunto.split(/\s*[-–/]\s*/)[0].trim().toLowerCase()

  // Línguas estrangeiras
  if (primeiro === 'inglês') return 'Inglês'
  if (primeiro === 'espanhol') return 'Espanhol'

  // Matemática (agrupa todos os sub-tópicos)
  if (primeiro === 'matemática' || MAT_SUBTOPICS.has(primeiro)) return 'Matemática'

  // Ciências da Natureza
  if (primeiro === 'física' || primeiro === 'física/química' || primeiro === 'física/astronomia') return 'Física'
  if (primeiro === 'química') return 'Química'
  if (primeiro === 'biologia') return 'Biologia'

  // Ciências Humanas
  if (['história', 'geografia', 'filosofia', 'sociologia', 'geopolítica', 'antropologia', 'economia', 'direito', 'política', 'educação'].includes(primeiro)) {
    return HUMANAS_MAP[primeiro] || primeiro.charAt(0).toUpperCase() + primeiro.slice(1)
  }

  // Linguagens (literatura, interpretação, gêneros textuais, música, etc.)
  if (['linguagens', 'literatura', 'música brasileira', 'literatura brasileira'].includes(primeiro)) return 'Linguagens'
  if (area === 'Linguagens') return 'Linguagens'
  if (area === 'Ciências Humanas') return 'Ciências Humanas'

  return area
}

// Ordem de exibição das matérias por área
export const MATERIAS_POR_AREA = {
  'Linguagens': ['Linguagens', 'Inglês', 'Espanhol'],
  'Ciências Humanas': ['História', 'Geografia', 'Filosofia', 'Sociologia'],
  'Ciências da Natureza': ['Física', 'Química', 'Biologia'],
  'Matemática': ['Matemática'],
}

// Lista completa e ordenada de todas as matérias
export const TODAS_MATERIAS = [
  'Linguagens', 'Inglês', 'Espanhol',
  'História', 'Geografia', 'Filosofia', 'Sociologia',
  'Física', 'Química', 'Biologia',
  'Matemática',
]