// Voice Configuration System - Task 2.1
// Manages voice settings for different languages and regions

export interface VoiceConfig {
  provider: string
  voiceId: string
  speed: number
  pitch: number
  region?: string
}

export interface VoiceOptions {
  language: 'en' | 'es'
  region?: string
  gender?: 'male' | 'female'
  accent?: string
}

export class VoiceConfiguration {
  // =====================================================
  // Voice Configuration
  // =====================================================

  /**
   * Get voice configuration for language and region
   */
  static getVoiceConfig(options: VoiceOptions): VoiceConfig {
    const { language, region, gender = 'female' } = options

    if (language === 'es') {
      return this.getSpanishVoiceConfig(region, gender)
    } else {
      return this.getEnglishVoiceConfig(region, gender)
    }
  }

  /**
   * Get Spanish voice configuration
   */
  private static getSpanishVoiceConfig(region?: string, gender: 'male' | 'female' = 'female'): VoiceConfig {
    // Default to Mexican Spanish if no region specified
    const targetRegion = region || 'mx'

    if (targetRegion === 'mx') {
      // Mexican Spanish voices
      return {
        provider: 'azure',
        voiceId: gender === 'female' ? 'es-MX-DaliaNeural' : 'es-MX-JorgeNeural',
        speed: 1.0,
        pitch: 1.0,
        region: 'mx'
      }
    } else if (targetRegion === 'es') {
      // Spain Spanish voices
      return {
        provider: 'azure',
        voiceId: gender === 'female' ? 'es-ES-ElviraNeural' : 'es-ES-AlvaroNeural',
        speed: 1.0,
        pitch: 1.0,
        region: 'es'
      }
    } else if (targetRegion === 'us') {
      // US Spanish voices
      return {
        provider: 'azure',
        voiceId: gender === 'female' ? 'es-US-PalomaNeural' : 'es-US-AlonsoNeural',
        speed: 1.0,
        pitch: 1.0,
        region: 'us'
      }
    } else {
      // Fallback to Mexican Spanish
      return this.getSpanishVoiceConfig('mx', gender)
    }
  }

  /**
   * Get English voice configuration
   */
  private static getEnglishVoiceConfig(region?: string, gender: 'male' | 'female' = 'female'): VoiceConfig {
    // Default to US English if no region specified
    const targetRegion = region || 'us'

    if (targetRegion === 'us') {
      // US English voices
      return {
        provider: 'azure',
        voiceId: gender === 'female' ? 'en-US-AriaNeural' : 'en-US-GuyNeural',
        speed: 1.0,
        pitch: 1.0,
        region: 'us'
      }
    } else if (targetRegion === 'gb') {
      // British English voices
      return {
        provider: 'azure',
        voiceId: gender === 'female' ? 'en-GB-SoniaNeural' : 'en-GB-RyanNeural',
        speed: 1.0,
        pitch: 1.0,
        region: 'gb'
      }
    } else if (targetRegion === 'au') {
      // Australian English voices
      return {
        provider: 'azure',
        voiceId: gender === 'female' ? 'en-AU-NatashaNeural' : 'en-AU-KenNeural',
        speed: 1.0,
        pitch: 1.0,
        region: 'au'
      }
    } else {
      // Fallback to US English
      return this.getEnglishVoiceConfig('us', gender)
    }
  }

  // =====================================================
  // Voice Quality Settings
  // =====================================================

  /**
   * Get optimized voice settings for emergency situations
   */
  static getEmergencyVoiceConfig(language: 'en' | 'es'): VoiceConfig {
    const baseConfig = this.getVoiceConfig({ language })
    
    return {
      ...baseConfig,
      speed: 0.9, // Slightly slower for clarity
      pitch: 1.1  // Slightly higher pitch for urgency
    }
  }

  /**
   * Get optimized voice settings for appointment booking
   */
  static getAppointmentVoiceConfig(language: 'en' | 'es'): VoiceConfig {
    const baseConfig = this.getVoiceConfig({ language })
    
    return {
      ...baseConfig,
      speed: 1.0, // Normal speed
      pitch: 1.0  // Normal pitch
    }
  }

  /**
   * Get optimized voice settings for customer service
   */
  static getCustomerServiceVoiceConfig(language: 'en' | 'es'): VoiceConfig {
    const baseConfig = this.getVoiceConfig({ language })
    
    return {
      ...baseConfig,
      speed: 1.1, // Slightly faster for efficiency
      pitch: 0.9  // Slightly lower pitch for professionalism
    }
  }

  // =====================================================
  // Voice Testing and Validation
  // =====================================================

  /**
   * Get all available voice options for a language
   */
  static getAvailableVoices(language: 'en' | 'es'): VoiceConfig[] {
    const voices: VoiceConfig[] = []

    if (language === 'es') {
      // Spanish voices
      voices.push(
        { provider: 'azure', voiceId: 'es-MX-DaliaNeural', speed: 1.0, pitch: 1.0, region: 'mx' },
        { provider: 'azure', voiceId: 'es-MX-JorgeNeural', speed: 1.0, pitch: 1.0, region: 'mx' },
        { provider: 'azure', voiceId: 'es-ES-ElviraNeural', speed: 1.0, pitch: 1.0, region: 'es' },
        { provider: 'azure', voiceId: 'es-ES-AlvaroNeural', speed: 1.0, pitch: 1.0, region: 'es' },
        { provider: 'azure', voiceId: 'es-US-PalomaNeural', speed: 1.0, pitch: 1.0, region: 'us' },
        { provider: 'azure', voiceId: 'es-US-AlonsoNeural', speed: 1.0, pitch: 1.0, region: 'us' }
      )
    } else {
      // English voices
      voices.push(
        { provider: 'azure', voiceId: 'en-US-AriaNeural', speed: 1.0, pitch: 1.0, region: 'us' },
        { provider: 'azure', voiceId: 'en-US-GuyNeural', speed: 1.0, pitch: 1.0, region: 'us' },
        { provider: 'azure', voiceId: 'en-GB-SoniaNeural', speed: 1.0, pitch: 1.0, region: 'gb' },
        { provider: 'azure', voiceId: 'en-GB-RyanNeural', speed: 1.0, pitch: 1.0, region: 'gb' },
        { provider: 'azure', voiceId: 'en-AU-NatashaNeural', speed: 1.0, pitch: 1.0, region: 'au' },
        { provider: 'azure', voiceId: 'en-AU-KenNeural', speed: 1.0, pitch: 1.0, region: 'au' }
      )
    }

    return voices
  }

  /**
   * Validate voice configuration
   */
  static validateVoiceConfig(config: VoiceConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.provider) {
      errors.push('Provider is required')
    }

    if (!config.voiceId) {
      errors.push('Voice ID is required')
    }

    if (config.speed < 0.5 || config.speed > 2.0) {
      errors.push('Speed must be between 0.5 and 2.0')
    }

    if (config.pitch < 0.5 || config.pitch > 2.0) {
      errors.push('Pitch must be between 0.5 and 2.0')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // =====================================================
  // Cultural Voice Adaptations
  // =====================================================

  /**
   * Get culturally appropriate voice for Spanish speakers
   */
  static getCulturalSpanishVoice(customerRegion?: string): VoiceConfig {
    // Default to Mexican Spanish for US market
    const region = customerRegion || 'mx'
    return this.getSpanishVoiceConfig(region, 'female')
  }

  /**
   * Get culturally appropriate voice for English speakers
   */
  static getCulturalEnglishVoice(customerRegion?: string): VoiceConfig {
    // Default to US English
    const region = customerRegion || 'us'
    return this.getEnglishVoiceConfig(region, 'female')
  }

  // =====================================================
  // Voice Performance Optimization
  // =====================================================

  /**
   * Get optimized voice config for different call types
   */
  static getOptimizedVoiceConfig(
    language: 'en' | 'es',
    callType: 'emergency' | 'appointment' | 'general',
    customerPreferences?: { gender?: 'male' | 'female'; region?: string }
  ): VoiceConfig {
    const baseOptions: VoiceOptions = {
      language,
      gender: customerPreferences?.gender || 'female',
      region: customerPreferences?.region
    }

    switch (callType) {
      case 'emergency':
        return this.getEmergencyVoiceConfig(language)
      case 'appointment':
        return this.getAppointmentVoiceConfig(language)
      case 'general':
        return this.getCustomerServiceVoiceConfig(language)
      default:
        return this.getVoiceConfig(baseOptions)
    }
  }
}

// =====================================================
// Voice Configuration Presets
// =====================================================

export const VOICE_PRESETS = {
  // Emergency situations - clear and urgent
  EMERGENCY_EN: { provider: 'azure', voiceId: 'en-US-AriaNeural', speed: 0.9, pitch: 1.1 },
  EMERGENCY_ES: { provider: 'azure', voiceId: 'es-MX-DaliaNeural', speed: 0.9, pitch: 1.1 },

  // Appointment booking - professional and clear
  APPOINTMENT_EN: { provider: 'azure', voiceId: 'en-US-AriaNeural', speed: 1.0, pitch: 1.0 },
  APPOINTMENT_ES: { provider: 'azure', voiceId: 'es-MX-DaliaNeural', speed: 1.0, pitch: 1.0 },

  // Customer service - friendly and efficient
  SERVICE_EN: { provider: 'azure', voiceId: 'en-US-AriaNeural', speed: 1.1, pitch: 0.9 },
  SERVICE_ES: { provider: 'azure', voiceId: 'es-MX-DaliaNeural', speed: 1.1, pitch: 0.9 }
} as const
