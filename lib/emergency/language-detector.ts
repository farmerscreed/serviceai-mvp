// Language Detection System - Task 2.2
// Detects language from call transcripts and provides language-specific keywords

import type { IndustryTemplate } from '@/lib/templates/types'

export interface LanguageDetectionResult {
  detectedLanguage: 'en' | 'es'
  confidence: number
  indicators: string[]
}

export class LanguageDetector {
  // =====================================================
  // Language Detection
  // =====================================================

  /**
   * Detect language from transcript text
   */
  static detectLanguage(transcript: string): 'en' | 'es' {
    const normalizedText = transcript.toLowerCase().trim()
    
    // Spanish indicators (from Hope Hall patterns)
    const spanishIndicators = [
      'usted', 'gracias', 'por favor', 'señor', 'señora',
      'buenos días', 'buenas tardes', 'buenas noches',
      'sí', 'no', 'mucho', 'muy', 'más', 'menos',
      'aquí', 'allí', 'ahora', 'después', 'antes',
      'mañana', 'hoy', 'ayer', 'semana', 'mes',
      'casa', 'trabajo', 'familia', 'problema', 'ayuda',
      'emergencia', 'urgente', 'inmediatamente', 'rápido',
      'caliente', 'frío', 'agua', 'luz', 'electricidad',
      'plomería', 'hvac', 'aire acondicionado', 'calefacción'
    ]

    // English indicators
    const englishIndicators = [
      'thank you', 'please', 'you', 'your', 'the', 'and', 'or',
      'good morning', 'good afternoon', 'good evening',
      'yes', 'no', 'much', 'very', 'more', 'less',
      'here', 'there', 'now', 'after', 'before',
      'tomorrow', 'today', 'yesterday', 'week', 'month',
      'house', 'work', 'family', 'problem', 'help',
      'emergency', 'urgent', 'immediately', 'quick',
      'hot', 'cold', 'water', 'light', 'electricity',
      'plumbing', 'hvac', 'air conditioning', 'heating'
    ]

    // Count indicators
    const spanishCount = spanishIndicators.reduce((count, indicator) => {
      return count + (normalizedText.includes(indicator) ? 1 : 0)
    }, 0)

    const englishCount = englishIndicators.reduce((count, indicator) => {
      return count + (normalizedText.includes(indicator) ? 1 : 0)
    }, 0)

    // Additional Spanish patterns
    const spanishPatterns = [
      /\b(usted|tú|su|tu)\b/g,
      /\b(gracias|por favor|disculpe)\b/g,
      /\b(sí|no|bueno|malo)\b/g,
      /\b(mucho|muy|más|menos)\b/g,
      /\b(aquí|allí|ahora|después)\b/g,
      /\b(mañana|hoy|ayer|semana)\b/g,
      /\b(casa|trabajo|familia|problema)\b/g,
      /\b(emergencia|urgente|inmediatamente)\b/g
    ]

    const englishPatterns = [
      /\b(you|your|the|and|or)\b/g,
      /\b(thank you|please|excuse me)\b/g,
      /\b(yes|no|good|bad)\b/g,
      /\b(much|very|more|less)\b/g,
      /\b(here|there|now|after)\b/g,
      /\b(tomorrow|today|yesterday|week)\b/g,
      /\b(house|work|family|problem)\b/g,
      /\b(emergency|urgent|immediately)\b/g
    ]

    // Count pattern matches
    const spanishPatternCount = spanishPatterns.reduce((count, pattern) => {
      const matches = normalizedText.match(pattern)
      return count + (matches ? matches.length : 0)
    }, 0)

    const englishPatternCount = englishPatterns.reduce((count, pattern) => {
      const matches = normalizedText.match(pattern)
      return count + (matches ? matches.length : 0)
    }, 0)

    // Calculate total scores
    const spanishScore = spanishCount + spanishPatternCount
    const englishScore = englishCount + englishPatternCount

    console.log(`Language detection scores - Spanish: ${spanishScore}, English: ${englishScore}`)

    // Return detected language (default to English if tied)
    return spanishScore > englishScore ? 'es' : 'en'
  }

  /**
   * Detect language with confidence score
   */
  static detectLanguageWithConfidence(transcript: string): LanguageDetectionResult {
    const normalizedText = transcript.toLowerCase().trim()
    
    // Spanish indicators with weights
    const spanishIndicators = [
      { word: 'usted', weight: 3 },
      { word: 'gracias', weight: 2 },
      { word: 'por favor', weight: 2 },
      { word: 'señor', weight: 2 },
      { word: 'señora', weight: 2 },
      { word: 'sí', weight: 1 },
      { word: 'no', weight: 1 },
      { word: 'mucho', weight: 1 },
      { word: 'muy', weight: 1 },
      { word: 'emergencia', weight: 3 },
      { word: 'urgente', weight: 3 }
    ]

    // English indicators with weights
    const englishIndicators = [
      { word: 'thank you', weight: 2 },
      { word: 'please', weight: 2 },
      { word: 'you', weight: 1 },
      { word: 'your', weight: 1 },
      { word: 'the', weight: 1 },
      { word: 'and', weight: 1 },
      { word: 'yes', weight: 1 },
      { word: 'no', weight: 1 },
      { word: 'much', weight: 1 },
      { word: 'very', weight: 1 },
      { word: 'emergency', weight: 3 },
      { word: 'urgent', weight: 3 }
    ]

    // Calculate weighted scores
    const spanishScore = spanishIndicators.reduce((score, indicator) => {
      const count = (normalizedText.match(new RegExp(indicator.word, 'g')) || []).length
      return score + (count * indicator.weight)
    }, 0)

    const englishScore = englishIndicators.reduce((score, indicator) => {
      const count = (normalizedText.match(new RegExp(indicator.word, 'g')) || []).length
      return score + (count * indicator.weight)
    }, 0)

    const totalScore = spanishScore + englishScore
    const detectedLanguage = spanishScore > englishScore ? 'es' : 'en'
    const confidence = totalScore > 0 ? Math.max(spanishScore, englishScore) / totalScore : 0.5

    // Get indicators that were found
    const foundIndicators = detectedLanguage === 'es' 
      ? spanishIndicators.filter(indicator => normalizedText.includes(indicator.word)).map(i => i.word)
      : englishIndicators.filter(indicator => normalizedText.includes(indicator.word)).map(i => i.word)

    return {
      detectedLanguage,
      confidence: Math.min(confidence, 1.0),
      indicators: foundIndicators
    }
  }

  // =====================================================
  // Emergency Keywords
  // =====================================================

  /**
   * Get emergency keywords for template and language
   */
  static getEmergencyKeywords(template: IndustryTemplate, language: 'en' | 'es'): string[] {
    if (language === 'es') {
      return template.emergency_patterns.keywords.es || []
    } else {
      return template.emergency_patterns.keywords.en || []
    }
  }

  /**
   * Get urgency indicators for language
   */
  static getUrgencyIndicators(language: 'en' | 'es'): string[] {
    if (language === 'es') {
      return [
        'emergencia', 'urgente', 'inmediatamente', 'ahora mismo',
        'rápido', 'pronto', 'ya', 'inmediato',
        'sin calefacción', 'sin aire', 'sin agua', 'sin luz',
        'fuga', 'goteo', 'roto', 'descompuesto',
        'peligroso', 'riesgo', 'daño', 'problema grave'
      ]
    } else {
      return [
        'emergency', 'urgent', 'immediately', 'right now',
        'quick', 'soon', 'asap', 'immediate',
        'no heat', 'no air', 'no water', 'no power',
        'leak', 'drip', 'broken', 'out of order',
        'dangerous', 'risk', 'damage', 'serious problem'
      ]
    }
  }

  /**
   * Get cultural communication indicators
   */
  static getCulturalIndicators(language: 'en' | 'es'): string[] {
    if (language === 'es') {
      return [
        'usted', 'señor', 'señora', 'formal',
        'gracias', 'por favor', 'disculpe',
        'familia', 'casa', 'trabajo',
        'ayuda', 'problema', 'situación'
      ]
    } else {
      return [
        'you', 'sir', 'ma\'am', 'formal',
        'thank you', 'please', 'excuse me',
        'family', 'home', 'work',
        'help', 'problem', 'situation'
      ]
    }
  }

  // =====================================================
  // Language-Specific Text Processing
  // =====================================================

  /**
   * Normalize text for language-specific processing
   */
  static normalizeTextForLanguage(text: string, language: 'en' | 'es'): string {
    let normalized = text.toLowerCase().trim()

    if (language === 'es') {
      // Spanish-specific normalization
      normalized = normalized
        .replace(/ñ/g, 'n')
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ü/g, 'u')
    }

    return normalized
  }

  /**
   * Extract phone numbers with language-specific patterns
   */
  static extractPhoneNumber(text: string, language: 'en' | 'es'): string | null {
    // Common phone number patterns (from Hope Hall)
    const phonePatterns = [
      /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
      /(\+?1[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format without parentheses
      /(\+?52[-.\s]?)?\(?([0-9]{2,3})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4})/g // Mexican format
    ]

    for (const pattern of phonePatterns) {
      const match = text.match(pattern)
      if (match) {
        // Clean up the phone number
        return match[0].replace(/[^\d+]/g, '')
      }
    }

    return null
  }

  /**
   * Extract addresses with language-specific patterns
   */
  static extractAddress(text: string, language: 'en' | 'es'): string | null {
    if (language === 'es') {
      // Spanish address patterns
      const spanishAddressPatterns = [
        /(calle|avenida|blvd|boulevard)\s+[^,]+,\s*[^,]+/gi,
        /(dirección|ubicación)\s*:?\s*[^,]+/gi,
        /(en|en la|en el)\s+[^,]+/gi
      ]

      for (const pattern of spanishAddressPatterns) {
        const match = text.match(pattern)
        if (match) {
          return match[0].trim()
        }
      }
    } else {
      // English address patterns
      const englishAddressPatterns = [
        /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)/gi,
        /(address|location)\s*:?\s*[^,]+/gi,
        /(at|on)\s+[^,]+/gi
      ]

      for (const pattern of englishAddressPatterns) {
        const match = text.match(pattern)
        if (match) {
          return match[0].trim()
        }
      }
    }

    return null
  }

  // =====================================================
  // Language Switching Detection
  // =====================================================

  /**
   * Detect language switching in conversation
   */
  static detectLanguageSwitching(transcript: string): {
    hasSwitching: boolean
    segments: Array<{ text: string; language: 'en' | 'es'; confidence: number }>
  } {
    // Split transcript into sentences
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const segments: Array<{ text: string; language: 'en' | 'es'; confidence: number }> = []
    let hasSwitching = false
    let previousLanguage: 'en' | 'es' | null = null

    for (const sentence of sentences) {
      const result = this.detectLanguageWithConfidence(sentence.trim())
      segments.push({
        text: sentence.trim(),
        language: result.detectedLanguage,
        confidence: result.confidence
      })

      if (previousLanguage && previousLanguage !== result.detectedLanguage) {
        hasSwitching = true
      }
      previousLanguage = result.detectedLanguage
    }

    return { hasSwitching, segments }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create language detector instance
 */
export function createLanguageDetector(): LanguageDetector {
  return new LanguageDetector()
}
