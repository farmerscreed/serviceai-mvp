// Urgency Calculator - Task 2.2
// Calculates urgency scores with cultural and industry-specific modifiers

export interface UrgencyModifiers {
  cultural: number
  industry: number
  weather: number
  timeOfDay: number
  customerType: number
}

export interface UrgencyCalculationResult {
  baseScore: number
  finalScore: number
  modifiers: UrgencyModifiers
  breakdown: string[]
}

export class UrgencyCalculator {
  // =====================================================
  // Base Urgency Calculation
  // =====================================================

  /**
   * Calculate base urgency score from keyword matching
   */
  static calculateBaseScore(transcript: string, keywords: string[]): number {
    const normalizedTranscript = transcript.toLowerCase()
    let score = 0.0

    // Weight keywords by importance
    const keywordWeights = this.getKeywordWeights(keywords)
    
    for (const keyword of keywords) {
      const weight = keywordWeights[keyword] || 1.0
      const occurrences = (normalizedTranscript.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      score += occurrences * weight * 0.1 // Each occurrence adds 0.1 * weight
    }

    // Cap base score at 0.8 to leave room for modifiers
    return Math.min(score, 0.8)
  }

  /**
   * Get keyword weights based on urgency level
   */
  private static getKeywordWeights(keywords: string[]): Record<string, number> {
    const weights: Record<string, number> = {}

    // High urgency keywords (weight 3.0)
    const highUrgencyKeywords = [
      'emergency', 'urgent', 'immediately', 'right now', 'asap',
      'emergencia', 'urgente', 'inmediatamente', 'ahora mismo', 'ya',
      'no heat', 'no air', 'no water', 'no power', 'out',
      'sin calefacción', 'sin aire', 'sin agua', 'sin luz', 'descompuesto',
      'gas leak', 'water leak', 'electrical fire', 'sparking',
      'fuga de gas', 'fuga de agua', 'incendio eléctrico', 'chispas'
    ]

    // Medium urgency keywords (weight 2.0)
    const mediumUrgencyKeywords = [
      'broken', 'not working', 'problem', 'issue', 'trouble',
      'roto', 'no funciona', 'problema', 'asunto', 'dificultad',
      'leak', 'drip', 'flooding', 'overflow',
      'fuga', 'goteo', 'inundación', 'desbordamiento',
      'hot', 'cold', 'temperature', 'weather',
      'caliente', 'frío', 'temperatura', 'clima'
    ]

    // Low urgency keywords (weight 1.0)
    const lowUrgencyKeywords = [
      'maintenance', 'check', 'inspection', 'service',
      'mantenimiento', 'revisar', 'inspección', 'servicio',
      'appointment', 'schedule', 'booking',
      'cita', 'programar', 'reservar'
    ]

    // Assign weights
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      
      if (highUrgencyKeywords.some(high => lowerKeyword.includes(high))) {
        weights[keyword] = 3.0
      } else if (mediumUrgencyKeywords.some(medium => lowerKeyword.includes(medium))) {
        weights[keyword] = 2.0
      } else if (lowUrgencyKeywords.some(low => lowerKeyword.includes(low))) {
        weights[keyword] = 1.0
      } else {
        weights[keyword] = 1.5 // Default weight
      }
    }

    return weights
  }

  // =====================================================
  // Cultural Modifiers
  // =====================================================

  /**
   * Apply cultural communication modifiers
   */
  static applyCulturalModifiers(baseScore: number, language: 'en' | 'es'): number {
    let culturalModifier = 0.0

    if (language === 'es') {
      // Spanish speakers may express urgency differently
      // They might be more direct about problems but less urgent in tone
      culturalModifier = 0.05 // Slight increase for Spanish cultural patterns
    } else {
      // English speakers tend to be more direct about urgency
      culturalModifier = 0.0 // No modifier for English
    }

    return Math.min(baseScore + culturalModifier, 1.0)
  }

  /**
   * Apply cultural context modifiers
   */
  static applyCulturalContextModifiers(
    baseScore: number,
    language: 'en' | 'es',
    culturalContext: string
  ): number {
    let contextModifier = 0.0

    if (language === 'es') {
      switch (culturalContext) {
        case 'formal_respectful':
          // Formal Spanish may understate urgency
          contextModifier = 0.1
          break
        case 'informal_friendly':
          // Informal Spanish may be more direct
          contextModifier = 0.05
          break
        case 'neutral_polite':
          // Neutral Spanish follows standard patterns
          contextModifier = 0.0
          break
      }
    } else {
      switch (culturalContext) {
        case 'polite_professional':
          // Polite English may understate urgency
          contextModifier = 0.05
          break
        case 'direct_urgent':
          // Direct English is clear about urgency
          contextModifier = 0.0
          break
        case 'neutral_professional':
          // Neutral English follows standard patterns
          contextModifier = 0.0
          break
      }
    }

    return Math.min(baseScore + contextModifier, 1.0)
  }

  // =====================================================
  // Industry-Specific Modifiers
  // =====================================================

  /**
   * Apply industry-specific urgency modifiers
   */
  static applyIndustryModifiers(
    baseScore: number,
    industryCode: string,
    context: any
  ): number {
    let industryModifier = 0.0

    switch (industryCode) {
      case 'hvac':
        industryModifier = this.getHVACModifiers(context)
        break
      case 'plumbing':
        industryModifier = this.getPlumbingModifiers(context)
        break
      case 'electrical':
        industryModifier = this.getElectricalModifiers(context)
        break
      default:
        industryModifier = 0.0
    }

    return Math.min(baseScore + industryModifier, 1.0)
  }

  /**
   * Get HVAC-specific modifiers
   */
  private static getHVACModifiers(context: any): number {
    let modifier = 0.0

    // Weather-based urgency
    if (context.weatherData) {
      const temp = context.weatherData.temperature
      if (temp < 32) {
        // Freezing temperatures - heating emergency
        modifier += 0.2
      } else if (temp > 90) {
        // Hot temperatures - cooling emergency
        modifier += 0.15
      }
    }

    // Time of day modifiers
    const hour = new Date().getHours()
    if (hour >= 22 || hour <= 6) {
      // Night time - more urgent for heating/cooling
      modifier += 0.1
    }

    return modifier
  }

  /**
   * Get plumbing-specific modifiers
   */
  private static getPlumbingModifiers(context: any): number {
    let modifier = 0.0

    // Weather-based modifiers
    if (context.weatherData) {
      const temp = context.weatherData.temperature
      if (temp < 32) {
        // Freezing temperatures - pipe burst risk
        modifier += 0.25
      }
    }

    // Water damage urgency
    if (context.waterDamage) {
      modifier += 0.2
    }

    return modifier
  }

  /**
   * Get electrical-specific modifiers
   */
  private static getElectricalModifiers(context: any): number {
    let modifier = 0.0

    // Safety hazard urgency
    if (context.safetyHazard) {
      modifier += 0.3
    }

    // Power outage urgency
    if (context.powerOutage) {
      modifier += 0.2
    }

    return modifier
  }

  // =====================================================
  // Comprehensive Urgency Calculation
  // =====================================================

  /**
   * Calculate comprehensive urgency score with all modifiers
   */
  static calculateComprehensiveUrgency(
    transcript: string,
    keywords: string[],
    language: 'en' | 'es',
    industryCode: string,
    context: any
  ): UrgencyCalculationResult {
    const breakdown: string[] = []

    // 1. Base score from keywords
    const baseScore = this.calculateBaseScore(transcript, keywords)
    breakdown.push(`Base score from keywords: ${baseScore.toFixed(2)}`)

    // 2. Cultural modifiers
    const culturalScore = this.applyCulturalModifiers(baseScore, language)
    const culturalModifier = culturalScore - baseScore
    breakdown.push(`Cultural modifier (${language}): +${culturalModifier.toFixed(2)}`)

    // 3. Industry modifiers
    const industryScore = this.applyIndustryModifiers(culturalScore, industryCode, context)
    const industryModifier = industryScore - culturalScore
    breakdown.push(`Industry modifier (${industryCode}): +${industryModifier.toFixed(2)}`)

    // 4. Additional context modifiers
    const finalScore = this.applyContextModifiers(industryScore, context)
    const contextModifier = finalScore - industryScore
    if (contextModifier > 0) {
      breakdown.push(`Context modifier: +${contextModifier.toFixed(2)}`)
    }

    const modifiers: UrgencyModifiers = {
      cultural: culturalModifier,
      industry: industryModifier,
      weather: context.weatherData ? 0.1 : 0.0,
      timeOfDay: this.getTimeOfDayModifier(),
      customerType: this.getCustomerTypeModifier(context)
    }

    return {
      baseScore,
      finalScore: Math.min(finalScore, 1.0),
      modifiers,
      breakdown
    }
  }

  /**
   * Apply additional context modifiers
   */
  private static applyContextModifiers(score: number, context: any): number {
    let modifier = 0.0

    // Time of day modifier
    modifier += this.getTimeOfDayModifier()

    // Customer type modifier
    modifier += this.getCustomerTypeModifier(context)

    // Weather modifier
    if (context.weatherData) {
      modifier += 0.05
    }

    return Math.min(score + modifier, 1.0)
  }

  /**
   * Get time of day modifier
   */
  private static getTimeOfDayModifier(): number {
    const hour = new Date().getHours()
    
    if (hour >= 22 || hour <= 6) {
      return 0.1 // Night time - more urgent
    } else if (hour >= 7 && hour <= 9) {
      return 0.05 // Morning rush - slightly more urgent
    } else if (hour >= 17 && hour <= 19) {
      return 0.05 // Evening rush - slightly more urgent
    }
    
    return 0.0
  }

  /**
   * Get customer type modifier
   */
  private static getCustomerTypeModifier(context: any): number {
    if (context.customerType === 'elderly') {
      return 0.1 // Elderly customers - more urgent
    } else if (context.customerType === 'business') {
      return 0.05 // Business customers - slightly more urgent
    }
    
    return 0.0
  }

  // =====================================================
  // Urgency Thresholds
  // =====================================================

  /**
   * Get urgency level from score
   */
  static getUrgencyLevel(score: number): 'low' | 'medium' | 'high' | 'emergency' {
    if (score >= 0.8) {
      return 'emergency'
    } else if (score >= 0.6) {
      return 'high'
    } else if (score >= 0.4) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * Check if immediate attention is required
   */
  static requiresImmediateAttention(score: number): boolean {
    return score >= 0.7
  }

  /**
   * Get response time based on urgency
   */
  static getResponseTime(score: number): string {
    if (score >= 0.9) {
      return '15-30 minutes'
    } else if (score >= 0.8) {
      return '30-45 minutes'
    } else if (score >= 0.7) {
      return '45-60 minutes'
    } else if (score >= 0.5) {
      return '1-2 hours'
    } else {
      return '2-4 hours'
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create urgency calculator instance
 */
export function createUrgencyCalculator(): UrgencyCalculator {
  return new UrgencyCalculator()
}
