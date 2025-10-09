/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { trackCallUsage, checkUsageLimits } from './usage-tracker.ts';

// ENHANCED: Configuration flag for gradual rollout
const USE_ENHANCED_PARSING = true; // Set to false to rollback quickly if needed

// Global error handling utilities
class WebhookError extends Error {
  statusCode;
  errorCode;
  context;
  constructor(message, statusCode = 500, errorCode = 'WEBHOOK_ERROR', context){
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.context = context;
    this.name = 'WebhookError';
  }
}

// Error response helper
function createErrorResponse(error, context) {
  const isWebhookError = error instanceof WebhookError;
  const statusCode = isWebhookError ? error.statusCode : 500;
  const errorCode = isWebhookError ? error.errorCode : 'INTERNAL_ERROR';
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: error.message,
      context: isWebhookError ? error.context : context,
      timestamp: new Date().toISOString()
    }
  };
  console.error('=== ERROR RESPONSE ===');
  console.error('Status:', statusCode);
  console.error('Code:', errorCode);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

// Async error wrapper
async function withErrorHandling(operation, errorContext) {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${errorContext}:`, error);
    throw new WebhookError(`Failed to ${errorContext}: ${error.message}`, 500, 'OPERATION_FAILED', {
      operation: errorContext,
      originalError: error.message
    });
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ============================================================================
// ENHANCED: NEW DATE PARSING FUNCTION - REPLACES BROKEN ORIGINAL
// ============================================================================
function parseRequestedDateEnhanced(requestedDay, timezone = 'UTC') {
  console.log('--- Enhanced parseRequestedDate ---');
  console.log('Input requestedDay:', requestedDay);
  console.log('timezone:', timezone);
  
  // CRITICAL: Input validation to prevent the error you experienced
  if (!requestedDay || typeof requestedDay !== 'string') {
    console.log('❌ Invalid requestedDay input:', requestedDay);
    return {
      targetDate: null,
      dayOfWeek: null,
      dbDate: null,
      validationMessage: "I need a specific day for the tour. When would you like to visit? Please say something like 'tomorrow', 'friday', or 'next monday'."
    };
  }
  
  // Additional safety check for empty strings
  if (requestedDay.trim().length === 0) {
    console.log('❌ Empty requestedDay input');
    return {
      targetDate: null,
      dayOfWeek: null,
      dbDate: null,
      validationMessage: "I need a specific day for the tour. What day would work best for you?"
    };
  }
  
  // Get current date
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Now it's safe to normalize input
  const normalizedDay = requestedDay.toLowerCase().trim();
  
  // SPANISH TO ENGLISH TRANSLATION MAP
  const spanishToEnglish = {
    'mañana': 'tomorrow',
    'hoy': 'today', 
    'pasado mañana': 'day after tomorrow',
    'lunes': 'monday',
    'martes': 'tuesday', 
    'miércoles': 'wednesday',
    'miercoles': 'wednesday', // without accent
    'jueves': 'thursday',
    'viernes': 'friday',
    'sábado': 'saturday',
    'sabado': 'saturday', // without accent
    'domingo': 'sunday',
    'próximo': 'next',
    'proximo': 'next', // without accent
    'este': 'this',
    'esta': 'this'
  };
  
  // WEEKDAY MAPPING
  const weekdayMap = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  };
  
  // Step 1: Translate Spanish to English if needed
  let processedDay = normalizedDay;
  Object.entries(spanishToEnglish).forEach(([spanish, english]) => {
    processedDay = processedDay.replace(new RegExp(`\\b${spanish}\\b`, 'g'), english);
  });
  
  console.log('After Spanish translation:', processedDay);
  
  // Step 2: Handle relative dates (tomorrow, today, etc.)
  if (processedDay === 'today' || processedDay === 'hoy') {
    const targetDate = new Date(today);
    return createDateResult(targetDate, timezone);
  }
  
  if (processedDay === 'tomorrow' || processedDay === 'mañana') {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 1);
    return createDateResult(targetDate, timezone);
  }
  
  if (processedDay === 'day after tomorrow' || processedDay === 'pasado mañana') {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 2);
    return createDateResult(targetDate, timezone);
  }
  
  // Step 3: Handle "this/next + weekday" patterns
  const relativeDayMatch = processedDay.match(/(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (relativeDayMatch) {
    const modifier = relativeDayMatch[1]; // "this" or "next"
    const targetDayName = relativeDayMatch[2]; // "monday", etc.
    const targetDayNum = weekdayMap[targetDayName];
    
    const targetDate = new Date(today);
    const currentDayNum = targetDate.getDay();
    
    let daysToAdd = targetDayNum - currentDayNum;
    
    if (modifier === 'this') {
      // If the day already passed this week, go to next week
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
    } else if (modifier === 'next') {
      // Always go to next week
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      } else {
        daysToAdd += 7; // Next week even if day hasn't passed
      }
    }
    
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return createDateResult(targetDate, timezone);
  }
  
  // Step 4: Handle standalone weekdays (assume next occurrence)
  const standaloneWeekday = Object.keys(weekdayMap).find(day => 
    processedDay === day || processedDay.endsWith(day)
  );
  
  if (standaloneWeekday) {
    const targetDayNum = weekdayMap[standaloneWeekday];
    const targetDate = new Date(today);
    const currentDayNum = targetDate.getDay();
    
    let daysToAdd = targetDayNum - currentDayNum;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }
    
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return createDateResult(targetDate, timezone);
  }
  
  // Step 5: Handle specific date formats (MM/DD, MM-DD, etc.)
  const dateFormats = [
    /(\d{1,2})\/(\d{1,2})/, // MM/DD
    /(\d{1,2})-(\d{1,2})/, // MM-DD
    /(\d{1,2})\.(\d{1,2})/, // MM.DD
  ];
  
  for (const format of dateFormats) {
    const match = processedDay.match(format);
    if (match) {
      const month = parseInt(match[1]) - 1; // 0-based
      const day = parseInt(match[2]);
      
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        const targetDate = new Date(currentYear, month, day);
        
        // If the date has passed this year, assume next year
        if (targetDate < today) {
          targetDate.setFullYear(currentYear + 1);
        }
        
        return createDateResult(targetDate, timezone);
      }
    }
  }
  
  // Step 6: Handle "in X days" format
  const daysMatch = processedDay.match(/in\s+(\d+)\s+days?/);
  if (daysMatch) {
    const daysToAdd = parseInt(daysMatch[1]);
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return createDateResult(targetDate, timezone);
  }
  
  // Step 7: Handle "next week" format
  if (processedDay.includes('next week')) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 7);
    return createDateResult(targetDate, timezone);
  }
  
  // Step 8: Handle "this weekend" format
  if (processedDay.includes('this weekend') || processedDay.includes('weekend')) {
    const targetDate = new Date(today);
    const currentDay = targetDate.getDay();
    const daysToSaturday = 6 - currentDay;
    targetDate.setDate(targetDate.getDate() + daysToSaturday);
    return createDateResult(targetDate, timezone);
  }
  
  // If no pattern matches, return error
  console.log('❌ No date pattern matched for:', processedDay);
  return {
    targetDate: null,
    dayOfWeek: null,
    dbDate: null,
    validationMessage: `I didn't understand "${requestedDay}" as a date. Please try saying something like "tomorrow", "friday", "next monday", or "in 3 days".`
  };
}

// Helper function to create consistent date result objects
function createDateResult(date, timezone) {
  const dayOfWeek = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    timeZone: timezone 
  }).toLowerCase();
  
  // Format for database: YYYY-MM-DD
  const dbDate = date.toISOString().split('T')[0];
  
  return {
    targetDate: date,
    dayOfWeek: dayOfWeek,
    dbDate: dbDate, // This is what goes into your tours.tour_date column
    validationMessage: null
  };
}

// ============================================================================
// ENHANCED: NEW TIME PARSING FUNCTION
// ============================================================================
function parseRequestedTime(requestedTime) {
  console.log('--- Enhanced parseRequestedTime ---');
  console.log('Input requestedTime:', requestedTime);
  
  if (!requestedTime) {
    return {
      dbTime: null,
      displayTime: null,
      validationMessage: "Please specify a time like '2 PM' or '14:00'."
    };
  }
  
  // Normalize input
  const normalizedTime = requestedTime.toLowerCase().trim();
  
  // SPANISH TO ENGLISH TIME TRANSLATION
  const spanishTimeMap = {
    'las': 'at', // "a las nueve" = "at nine"
    'nueve': 'nine',
    'ocho': 'eight', 
    'siete': 'seven',
    'seis': 'six',
    'cinco': 'five',
    'cuatro': 'four',
    'tres': 'three',
    'dos': 'two',
    'una': 'one',
    'diez': 'ten',
    'once': 'eleven',
    'doce': 'twelve',
    'de la mañana': 'am',
    'de la tarde': 'pm',
    'de la noche': 'pm',
    'mañana': 'morning', // context dependent
    'tarde': 'afternoon',
    'noche': 'evening'
  };
  
  // NUMBER WORD TO DIGIT MAPPING
  const numberWords = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
    'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18',
    'nineteen': '19', 'twenty': '20'
  };
  
  // Step 1: Translate Spanish time expressions
  let processedTime = normalizedTime;
  Object.entries(spanishTimeMap).forEach(([spanish, english]) => {
    processedTime = processedTime.replace(new RegExp(`\\b${spanish}\\b`, 'g'), english);
  });
  
  // Step 2: Convert number words to digits
  Object.entries(numberWords).forEach(([word, digit]) => {
    processedTime = processedTime.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  });
  
  console.log('After translation:', processedTime);
  
  // Step 3: Parse various time formats
  const timePatterns = [
    // Standard formats: "2:30 PM", "14:30", "2 PM", "2pm"
    /(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i,
    // "at 2", "at nine", "2 o'clock"
    /(?:at\s+)?(\d{1,2})\s*(?:o'?clock)?(?:\s*(am|pm))?/i,
    // Military time: "1430", "0900"
    /(\d{4})/,
    // Spanish format after translation: "9 am"
    /(\d{1,2})\s*(am|pm|morning|afternoon|evening)/i
  ];
  
  let hour = null;
  let minute = 0;
  let ampm = null;
  
  for (const pattern of timePatterns) {
    const match = processedTime.match(pattern);
    if (match) {
      if (pattern.source.includes('\\d{4}')) {
        // Military time: "1430" -> 14:30
        const timeStr = match[1];
        hour = parseInt(timeStr.substring(0, 2));
        minute = parseInt(timeStr.substring(2, 4));
      } else {
        hour = parseInt(match[1]);
        minute = match[2] ? parseInt(match[2]) : 0;
        ampm = match[3] ? match[3].toLowerCase() : null;
      }
      break;
    }
  }
  
  if (hour === null) {
    return {
      dbTime: null,
      displayTime: null,
      validationMessage: `I couldn't understand the time "${requestedTime}". Please try "2 PM", "14:30", or "nine AM".`
    };
  }
  
  // Step 4: Handle AM/PM conversion and context clues
  if (ampm) {
    if (ampm.includes('pm') || ampm === 'afternoon' || ampm === 'evening') {
      if (hour < 12) hour += 12;
    } else if (ampm.includes('am') || ampm === 'morning') {
      if (hour === 12) hour = 0;
    }
  } else if (hour < 8) {
    // Context clue: times before 8 without AM/PM are likely PM for venue tours
    hour += 12;
  }
  
  // Step 5: Validate time range
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return {
      dbTime: null,
      displayTime: null,
      validationMessage: `Invalid time "${requestedTime}". Please use a valid time between 00:00 and 23:59.`
    };
  }
  
  // Step 6: Format for database and display
  const dbTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayAmPm = hour >= 12 ? 'PM' : 'AM';
  const displayTime = `${displayHour}:${String(minute).padStart(2, '0')} ${displayAmPm}`;
  
  console.log('Parsed time result:', { dbTime, displayTime });
  
  return {
    dbTime: dbTime,        // For tours.tour_time column: "09:00:00"
    displayTime: displayTime, // For user communication: "9:00 AM"
    validationMessage: null
  };
}

// ============================================================================
// ENHANCED: FALLBACK WRAPPER FOR GRADUAL ROLLOUT
// ============================================================================
function parseRequestedDate(requestedDay, timezone = 'UTC') {
  if (USE_ENHANCED_PARSING) {
    try {
      const result = parseRequestedDateEnhanced(requestedDay, timezone);
      console.log('✅ Enhanced parsing succeeded:', result);
      logSuccessfulInteraction(requestedDay, '', 'Date parsing succeeded');
      return result;
    } catch (error) {
      console.error('Enhanced parsing failed, falling back to original:', error);
      // Fall back to original parsing logic if needed
      return parseRequestedDateOriginal(requestedDay, timezone);
    }
  } else {
    return parseRequestedDateOriginal(requestedDay, timezone);
  }
}

// Original parsing function as fallback
function parseRequestedDateOriginal(requestedDay, timezone = 'UTC') {
  console.log('--- Original parseRequestedDate (fallback) ---');
  console.log('requestedDay:', requestedDay);
  console.log('timezone:', timezone);
  
  // Handle "this" and "next" weekdays
  const weekdayMap = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  };
  
  const relativeDayMatch = requestedDay.match(/(this|next) (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (relativeDayMatch) {
    const today = new Date();
    const targetDay = weekdayMap[relativeDayMatch[2].toLowerCase()];
    let dayOffset = targetDay - today.getDay();
    if (dayOffset <= 0 && relativeDayMatch[1].toLowerCase() === 'this') {
      dayOffset += 7;
    }
    if (relativeDayMatch[1].toLowerCase() === 'next') {
      dayOffset += 7;
    }
    const targetDate = new Date(today.setDate(today.getDate() + dayOffset));
    const dayOfWeek = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: timezone
    }).toLowerCase();
    return { targetDate, dayOfWeek, validationMessage: undefined };
  }
  
  // Handle other date formats with the Date constructor
  const parsedResult = new Date(requestedDay);
  console.log('parsedResult:', parsedResult);
  if (!isNaN(parsedResult.getTime())) {
    const targetDate = parsedResult;
    const dayOfWeek = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: timezone
    }).toLowerCase();
    return { targetDate, dayOfWeek, validationMessage: undefined };
  } else {
    return {
      targetDate: null,
      dayOfWeek: null,
      validationMessage: `I couldn't understand the date. Please try "this Friday", "next Monday", or a specific date like "August 8th".`
    };
  }
}

// Template variable replacement function
async function getPromptTemplate(supabase, organizationId, promptType, variables = {}) {
  try {
    const { data: promptData, error } = await supabase.from('organization_prompts').select('prompt_template, variables').eq('organization_id', organizationId).eq('prompt_type', promptType).eq('is_active', true).single();
    if (error || !promptData) {
      console.log(`No prompt template found for ${promptType}, using fallback`);
      return getFallbackPrompt(promptType, variables);
    }
    let template = promptData.prompt_template;
    // Replace template variables
    Object.entries(variables).forEach(([key, value])=>{
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      template = template.replace(regex, String(value));
    });
    return template;
  } catch (error) {
    console.error('Error getting prompt template:', error);
    return getFallbackPrompt(promptType, variables);
  }
}

// Fallback prompts for when database templates aren't available
function getFallbackPrompt(promptType, variables) {
  const fallbacks = {
    'greeting': `Hi! This is Sophie from ${variables.venue_name || 'our venue'}. Thanks for calling!`,
    'tour_confirmation': `Perfect! I've scheduled your tour for ${variables.date} at ${variables.time}. You'll receive a confirmation email shortly.`,
    'venue_unavailable': `I'm sorry, but that date is already booked for ${variables.event_name || 'an event'}. Would you like to check a different date?`,
    'tour_unavailable': `I'm sorry, that time slot is already booked for another tour. Would you like to choose a different time?`,
    'pricing_info': `Our pricing for ${variables.event_type || 'events'} starts at $${variables.base_price || '1,500'}. Would you like to hear more details?`
  };
  return fallbacks[promptType] || 'Thank you for contacting us.';
}

// ENHANCED: Venue config with validation and fallbacks
async function getEnhancedVenueConfigWithValidation(supabase, organizationId) {
  return withErrorHandling(async ()=>{
    // Validate input
    if (!organizationId) {
      throw new WebhookError('Organization ID is required for venue config', 400, 'MISSING_ORGANIZATION_ID');
    }
    console.log('Loading venue config for organization:', organizationId);
    // Get from RPC function with validation
    const { data: venueConfig, error: configError } = await supabase.rpc('get_venue_config', {
      org_id: organizationId
    });
    if (configError) {
      console.error('RPC error:', configError);
      // Try fallback to direct organization query
      const { data: orgData, error: orgError } = await supabase.from('organizations').select('venue_name, venue_capacity, venue_pricing, venue_features, settings').eq('id', organizationId).single();
      if (orgError) {
        throw new WebhookError(`Failed to load venue configuration: ${orgError.message}`, 500, 'VENUE_CONFIG_ERROR', {
          organization_id: organizationId,
          rpc_error: configError,
          org_error: orgError
        });
      }
      console.log('Using fallback venue config from organizations table');
      return {
        venue_name: orgData.venue_name || 'Venue',
        venue_capacity: orgData.venue_capacity || 300,
        venue_pricing: orgData.venue_pricing || {},
        venue_features: orgData.venue_features || [],
        ...orgData.settings
      };
    }
    // Validate required fields
    if (!venueConfig) {
      throw new WebhookError(`No venue configuration found for organization: ${organizationId}`, 404, 'VENUE_CONFIG_NOT_FOUND', {
        organization_id: organizationId
      });
    }
    // Apply defaults for missing required fields
    const validatedConfig = {
      venue_name: venueConfig.venue_name || 'Venue',
      venue_capacity: venueConfig.venue_capacity || 300,
      venue_pricing: venueConfig.venue_pricing || {},
      venue_features: venueConfig.venue_features || [],
      tour_schedule: venueConfig.tour_schedule || {},
      business_hours: venueConfig.business_hours || {},
      ...venueConfig
    };
    console.log('Venue config loaded successfully:', validatedConfig.venue_name);
    return validatedConfig;
  }, 'load venue configuration');
}

// ENHANCED: Organization resolution with comprehensive error handling
async function getOrganizationFromPhoneWithValidation(supabase, vapiPhoneNumber) {
  return withErrorHandling(async ()=>{
    // Validate input
    if (!vapiPhoneNumber) {
      throw new WebhookError('VAPI phone number is required for organization resolution', 400, 'MISSING_PHONE_NUMBER');
    }
    if (!vapiPhoneNumber.startsWith('+')) {
      throw new WebhookError(`Invalid phone number format: ${vapiPhoneNumber}`, 400, 'INVALID_PHONE_FORMAT');
    }
    console.log('Resolving organization for phone:', vapiPhoneNumber);
    const { data: orgMapping, error: orgError } = await supabase.from('organization_phone_numbers').select('organization_id, phone_number').eq('phone_number', vapiPhoneNumber).single();
    if (orgError) {
      if (orgError.code === 'PGRST116') {
        throw new WebhookError(`No organization found for phone number: ${vapiPhoneNumber}`, 404, 'ORGANIZATION_NOT_FOUND', {
          phone_number: vapiPhoneNumber
        });
      }
      throw new WebhookError(`Database error during organization lookup: ${orgError.message}`, 500, 'DATABASE_ERROR', {
        phone_number: vapiPhoneNumber,
        postgres_error: orgError
      });
    }
    if (!orgMapping?.organization_id) {
      throw new WebhookError(`Organization mapping exists but missing organization_id for phone: ${vapiPhoneNumber}`, 500, 'INVALID_ORGANIZATION_MAPPING', {
        phone_number: vapiPhoneNumber,
        mapping: orgMapping
      });
    }
    console.log('Found organization:', orgMapping.organization_id);
    return orgMapping.organization_id;
  }, 'resolve organization from phone number');
}

// Context detection: Determine if interaction is phone call or web chat
function detectInteractionContext(message, call, callerPhone) {
  console.log('=== DETECTING INTERACTION CONTEXT ===');
  // Check for clear phone call indicators
  if (callerPhone && callerPhone.startsWith('+') && callerPhone.length > 5) {
    return {
      type: 'phone',
      identifier: callerPhone,
      sessionId: call?.id || `phone-${Date.now()}`
    };
  }
  // Check for template variables (indicates phone call that failed to resolve)
  if (callerPhone && callerPhone.includes('⟦call.from⟧')) {
    console.log('Template variable detected - likely phone call with resolution failure');
    return {
      type: 'phone',
      identifier: `unresolved-${call?.id || Date.now()}`,
      sessionId: call?.id || `phone-unresolved-${Date.now()}`
    };
  }
  // Check for chat indicators
  if (callerPhone === '' || callerPhone === null || callerPhone?.startsWith('chat-')) {
    return {
      type: 'chat',
      identifier: `chat-${call?.id || Date.now()}`,
      sessionId: call?.id || `chat-${Date.now()}`
    };
  }
  // Check for web-based indicators
  if (message?.origin === 'web' || call?.source === 'web') {
    return {
      type: 'web',
      identifier: `web-${call?.id || Date.now()}`,
      sessionId: call?.id || `web-${Date.now()}`
    };
  }
  // Default fallback
  console.log('Could not determine context, defaulting to chat');
  return {
    type: 'chat',
    identifier: `unknown-${Date.now()}`,
    sessionId: call?.id || `unknown-${Date.now()}`
  };
}

// REFINED: More robust idempotency control.
const processedEvents = new Map();
function checkIdempotency(eventType, callId, messageId) {
  const idempotencyKey = `${eventType}-${callId}-${messageId}`;
  const now = Date.now();
  if (processedEvents.has(idempotencyKey)) {
    console.log('⚠️ Duplicate event detected, skipping:', idempotencyKey);
    return false;
  }
  processedEvents.set(idempotencyKey, now);
  // Clean up old entries to prevent memory leaks
  if (processedEvents.size > 5000) {
    for (const [key, timestamp] of processedEvents.entries()){
      if (now - timestamp > 1000 * 60 * 15) {
        processedEvents.delete(key);
      }
    }
  }
  return true;
}

// ============================================================================
// ENHANCED: TOUR AVAILABILITY FUNCTION - REPLACES BROKEN ORIGINAL
// ============================================================================
async function handleCheckTourAvailability(supabase, args, organizationId, venueConfig) {
  console.log('--- Enhanced handleCheckTourAvailability ---');
  console.log('args:', args);
  
  const { requestedDay, requestedTime } = args;
  
  // Step 1: Validate inputs
  if (!requestedDay || !requestedTime) {
    return 'I need both a day and time to check tour availability. What day and time would you prefer for your tour?';
  }
  
  // Step 2: Parse the requested date using our enhanced parser
  const dateResult = USE_ENHANCED_PARSING ? 
    parseRequestedDateEnhanced(requestedDay) : 
    parseRequestedDate(requestedDay);
  
  if (dateResult.validationMessage) {
    return dateResult.validationMessage;
  }
  
  const dbDate = dateResult.dbDate || dateResult.targetDate?.toISOString().split('T')[0];
  const dayOfWeek = dateResult.dayOfWeek;
  
  console.log('Parsed date:', { dbDate, dayOfWeek });
  
  // Step 3: Parse the requested time
  const timeResult = USE_ENHANCED_PARSING ? 
    parseRequestedTime(requestedTime) : 
    parseRequestedTimeOriginal(requestedTime);
  
  if (timeResult.validationMessage) {
    return timeResult.validationMessage;
  }
  
  const dbTime = timeResult.dbTime || timeResult.time;
  const displayTime = timeResult.displayTime || timeResult.time;
  
  console.log('Parsed time:', { dbTime, displayTime });
  
  // Step 4: Check if tours are offered on this day of week
  const tourSchedule = venueConfig?.settings?.tour_schedule || {};
  const daySchedule = tourSchedule[dayOfWeek] || [];
  
  console.log('Tour schedule for', dayOfWeek, ':', daySchedule);
  
  if (!daySchedule || daySchedule.length === 0) {
    // Find alternative days when tours are available
    const availableDays = Object.keys(tourSchedule).filter(day => 
      tourSchedule[day] && tourSchedule[day].length > 0
    );
    
    if (availableDays.length === 0) {
      return "We currently don't have any tour times available. Please contact us directly to schedule a visit.";
    }
    
    const daysList = availableDays.join(', ');
    return `We don't offer tours on ${dayOfWeek}s. We have tours available on ${daysList}. Which day would work better for you?`;
  }
  
  // Step 5: Check if the requested time matches any available slot
  const requestedTimeSlot = dbTime.substring(0, 5); // Convert "09:00:00" to "09:00"
  const isTimeSlotAvailable = daySchedule.includes(requestedTimeSlot);
  
  if (!isTimeSlotAvailable) {
    // Convert available slots to user-friendly display times
    const availableTimes = daySchedule.map(slot => {
      const [hour, minute] = slot.split(':');
      const hourNum = parseInt(hour);
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      return `${displayHour}:${minute} ${ampm}`;
    });
    
    const timesList = availableTimes.join(', ');
    return `We don't have tours at ${displayTime} on ${dayOfWeek}s. Available times are: ${timesList}. Which time would you prefer?`;
  }
  
  // Step 6: Check if the specific time slot is already booked
  try {
    const { data: existingTours, error } = await supabase
      .from('tours')
      .select('id, tour_status')
      .eq('organization_id', organizationId)
      .eq('tour_date', dbDate)
      .eq('tour_time', dbTime)
      .in('tour_status', ['scheduled', 'confirmed', 'in_progress']);
    
    if (error) {
      console.error('Error checking existing tours:', error);
      return "I'm having trouble checking tour availability. Please try again or contact us directly.";
    }
    
    // Step 7: Determine availability based on venue capacity
    const maxToursPerSlot = venueConfig?.settings?.max_tours_per_slot || 3; // Default to 3 concurrent tours
    const bookedCount = existingTours ? existingTours.length : 0;
    
    console.log('Tours already booked for this slot:', bookedCount);
    console.log('Max tours per slot:', maxToursPerSlot);
    
    if (bookedCount >= maxToursPerSlot) {
      // This specific time is full, suggest other times on the same day
      const alternativeSlots = daySchedule.filter(slot => slot !== requestedTimeSlot);
      
      if (alternativeSlots.length === 0) {
        // No other slots on this day, suggest different days
        const availableDays = Object.keys(tourSchedule).filter(day => 
          day !== dayOfWeek && tourSchedule[day] && tourSchedule[day].length > 0
        );
        
        if (availableDays.length === 0) {
          return "Unfortunately, we're fully booked. Please contact us directly to explore other options.";
        }
        
        return `That time slot is fully booked. Would you like to choose a different day? We have tours available on ${availableDays.join(', ')}.`;
      }
      
      // Check alternative slots on the same day
      const availableAlternatives = [];
      
      for (const altSlot of alternativeSlots) {
        const altDbTime = `${altSlot}:00`;
        
        const { data: altTours, error: altError } = await supabase
          .from('tours')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('tour_date', dbDate)
          .eq('tour_time', altDbTime)
          .in('tour_status', ['scheduled', 'confirmed', 'in_progress']);
        
        if (!altError && (!altTours || altTours.length < maxToursPerSlot)) {
          // Convert to display time
          const [hour, minute] = altSlot.split(':');
          const hourNum = parseInt(hour);
          const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          availableAlternatives.push(`${displayHour}:${minute} ${ampm}`);
        }
      }
      
      if (availableAlternatives.length === 0) {
        return `That time slot is fully booked and we don't have other availability on ${dayOfWeek}. Would you like to choose a different day?`;
      }
      
      const alternativesList = availableAlternatives.join(', ');
      return `That time slot is fully booked. We have availability on ${dayOfWeek} at: ${alternativesList}. Which time would you prefer?`;
    }
    
    // Step 8: Time slot is available!
    const targetDate = dateResult.targetDate || new Date(dbDate);
    const formattedDate = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',  
      day: 'numeric'
    });
    
    return `Perfect! ${displayTime} on ${formattedDate} is available for a tour. Would you like me to schedule that for you?`;
    
  } catch (error) {
    console.error('Error in tour availability check:', error);
    return "I'm having trouble checking availability right now. Please try again or contact us directly.";
  }
}

// Fallback time parsing for original system
function parseRequestedTimeOriginal(requestedTime) {
  console.log('--- Original time parsing (fallback) ---');
  
  if (!requestedTime) {
    return { time: null, validationMessage: "Please specify a time." };
  }
  
  const timeMatch = requestedTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (!timeMatch) {
    return { time: null, validationMessage: "Please provide a valid time like '2 PM'." };
  }
  
  let hour = parseInt(timeMatch[1]);
  const minute = parseInt(timeMatch[2] || '00');
  const ampm = timeMatch[3].toLowerCase();
  
  if (ampm === 'pm' && hour < 12) {
    hour += 12;
  } else if (ampm === 'am' && hour === 12) {
    hour = 0;
  }
  
  const dbTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayAmPm = hour >= 12 ? 'PM' : 'AM';
  const displayTime = `${displayHour}:${String(minute).padStart(2, '0')} ${displayAmPm}`;
  
  return { time: dbTime, displayTime: displayTime, validationMessage: null };
}

// Main serve function
serve(async (req)=>{
  return withErrorHandling(async ()=>{
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    };
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: corsHeaders
      });
    }
    // VAPI WEBHOOK: No authentication required - VAPI sends requests without auth headers
    console.log('=== VAPI WEBHOOK RECEIVED (NO AUTH REQUIRED) ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers.get('content-type'));
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      const { message, call } = await req.json();
      console.log('=== VAPI WEBHOOK RECEIVED ===');
      console.log('Message type:', message?.type);
      console.log('Call ID:', call?.id);
      // NEW: Comprehensive debug logging for payload structure
      console.log('=== VAPI PAYLOAD EXTRACTION TEST ===');
      console.log('Customer phone:', call?.customer?.number);
      console.log('VAPI phone:', message?.phoneNumber?.number);
      console.log('Organization ID:', call?.orgId);
      console.log('Call ID:', call?.id);
      console.log('Message structure:', JSON.stringify(message, null, 2));
      console.log('Call structure:', JSON.stringify(call, null, 2));
      // REFINED: Idempotency Check
      const messageId = message?.id || message?.type;
      if (!checkIdempotency(message?.type || 'unknown', call?.id || 'unknown', messageId)) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Duplicate event ignored.'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // ENHANCED: Extract phone with context
      const phoneResult = await extractPhone(supabase, message, call);
      const vapiPhoneNumber = extractVapiPhoneNumber(message, call);
      // ENHANCED: Get organization ID with validation and fallback
      const organizationId = await getValidatedOrganizationId(supabase, message, call, vapiPhoneNumber || '');
      // Enhanced logging for debugging
      console.log('Caller phone number:', phoneResult.phone);
      console.log('VAPI phone number:', vapiPhoneNumber);
      console.log('Final validated organization ID:', organizationId);
      // Skip phone number resolution entirely - use validated org ID directly
      const venueConfig = await getEnhancedVenueConfigWithValidation(supabase, organizationId);
      console.log('Venue config loaded:', venueConfig?.venue_name);
      // FIXED EVENT HANDLING LOGIC
      if (message.type === 'conversation-update') {
        console.log('=== CONVERSATION UPDATE ===');
      // Don't create call log here - wait for lead determination after getLeadProfile
      } else if (message.type === 'tool-calls') {
        console.log('=== TOOL CALLS ===');
        const toolCalls = message.toolCalls || [];
        console.log('Number of tool calls:', toolCalls.length);
        const results = [];
        for (const toolCall of toolCalls){
          console.log('Processing tool call:', toolCall.function?.name);
          console.log('Tool call arguments:', toolCall.function?.arguments);
          // CRITICAL FIX: Replace phone number variables in arguments
          let processedArgs = toolCall.function?.arguments || {};
          if (typeof processedArgs === 'string') {
            try {
              processedArgs = JSON.parse(processedArgs);
            } catch (e) {
              console.error('Error parsing tool arguments:', e);
              processedArgs = {};
            }
          }
          // ENHANCED: Context-aware variable replacement
          processedArgs = replacePhoneNumberVariablesWithContext(processedArgs, phoneResult);
          // ENHANCED: Validate tool call arguments
          if (toolCall.function?.name) {
            validateToolCallArguments(toolCall.function.name, processedArgs);
          }
          // Extract client name if not provided
          if (!processedArgs.clientName && message.transcript) {
            processedArgs.clientName = extractClientNameFromTranscript(message.transcript, processedArgs.clientName);
          }
          console.log('Processed arguments:', processedArgs);
          console.log('Context type:', phoneResult.context.type);
          let result = null;
          // Process tool calls with enhanced error handling
          try {
            if (toolCall.function?.name === 'getLeadProfile') {
              processedArgs.phoneNumber = phoneResult.phone;
              result = await handleGetLeadProfile(supabase, processedArgs, organizationId);
              await handleCallStartOnce(supabase, call, message, phoneResult, organizationId, venueConfig, result);
            } else if (toolCall.function?.name === 'log_hall_calls') {
              result = await handleLogHallCalls(supabase, processedArgs, organizationId, venueConfig, call);
            } else if (toolCall.function?.name === 'scheduleVenueTour') {
              result = await handleScheduleVenueTour(supabase, processedArgs, organizationId, venueConfig, message.transcript);
            } else if (toolCall.function?.name === 'checkVenueAvailability') {
              result = await handleCheckVenueAvailability(supabase, processedArgs, organizationId, venueConfig);
            } else if (toolCall.function?.name === 'checkTourAvailability') {
              result = await handleCheckTourAvailability(supabase, processedArgs, organizationId, await getEnhancedVenueConfigWithValidation(supabase, organizationId));
            } else if (toolCall.function?.name === 'providePricingInfo') {
              result = await handleProvidePricingInfo(supabase, processedArgs, organizationId, venueConfig);
            }
            // Track tool call
            await trackToolCall(supabase, call, toolCall, organizationId);
            results.push({
              toolCallId: toolCall.id,
              result: result
            });
          } catch (toolError) {
            console.error(`Error processing tool call ${toolCall.function?.name}:`, toolError);
            results.push({
              toolCallId: toolCall.id,
              error: toolError instanceof WebhookError ? toolError.message : 'Tool call processing failed'
            });
          }
        }
        console.log('Returning results to VAPI:', results);
        return new Response(JSON.stringify({
          results
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else if (message.type === 'hang' || message.type === 'end-of-call-report') {
        console.log('=== CALL END ===');
        await handleCallEnd(supabase, call, message, organizationId, venueConfig, phoneResult.phone || 'unknown');
        await sendToEnrichmentWebhook(supabase, call, message, organizationId, venueConfig, phoneResult.phone || 'unknown');
      }
      return new Response(JSON.stringify({
        success: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return createErrorResponse(error, {
        request_body: await req.text().catch(()=>'Unable to read request body'),
        timestamp: new Date().toISOString()
      });
    }
  }, 'process webhook request');
});

// [ALL THE REMAINING FUNCTIONS STAY EXACTLY THE SAME]
// Below this line, all functions remain unchanged to preserve existing functionality

// ENHANCED: Template variable replacement with context fallbacks
function replacePhoneNumberVariablesWithContext(args, phoneResult) {
  const { phone, context } = phoneResult;
  function replaceInValue(value) {
    if (typeof value === 'string') {
      let result = value;
      // Replace the unresolved template variables with actual phone
      result = result.replace(/\{\{call\.from\}\}/g, phone);
      result = result.replace(/⟦call\.from⟧/g, phone);
      result = result.replace(/\{\{call\.customer\.number\}\}/g, phone);
      result = result.replace(/⟦call\.customer\.number⟧/g, phone);
      result = result.replace(/\{call\.from\}/g, phone);
      result = result.replace(/\{call\.customer\.number\}/g, phone);
      if (result !== value) {
        console.log(`Template replacement: ${value} → ${result}`);
      }
      return result;
    } else if (typeof value === 'object' && value !== null) {
      const result = {};
      for (const [key, val] of Object.entries(value)){
        result[key] = replaceInValue(val);
      }
      return result;
    }
    return value;
  }
  return replaceInValue(args);
}

// Original function for backward compatibility
function replacePhoneNumberVariables(args, actualPhoneNumber) {
  const phoneVariables = [
    '⟦call.from⟧',
    '{{call.from}}',
    '{call.from}',
    '⟦call.customer.number⟧',
    '{{call.customer.number}}',
    '{call.customer.number}'
  ];
  function replaceInValue(value) {
    if (typeof value === 'string') {
      let result = value;
      phoneVariables.forEach((variable)=>{
        result = result.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), actualPhoneNumber);
      });
      return result;
    } else if (typeof value === 'object' && value !== null) {
      const result = {};
      for (const [key, val] of Object.entries(value)){
        result[key] = replaceInValue(val);
      }
      return result;
    }
    return value;
  }
  return replaceInValue(args);
}

// FIXED: Extract VAPI phone from actual payload structure
function extractVapiPhoneNumber(message, call) {
  console.log('=== EXTRACTING VAPI PHONE (ACTUAL STRUCTURE) ===');
  // Method 1: From phoneNumber object (most reliable based on your payload)
  if (message?.phoneNumber?.number) {
    console.log('Found VAPI phone from message.phoneNumber.number:', message.phoneNumber.number);
    return message.phoneNumber.number;
  }
  // Method 2: From call context if phoneNumber not in message
  if (call?.phoneNumber?.number) {
    console.log('Found VAPI phone from call.phoneNumber.number:', call.phoneNumber.number);
    return call.phoneNumber.number;
  }
  // Method 3: Try other possible locations
  const possibleSources = [
    message?.vapiPhoneNumber,
    call?.vapiPhoneNumber,
    message?.metadata?.vapiPhoneNumber,
    call?.metadata?.vapiPhoneNumber,
    message?.call?.vapiPhoneNumber,
    call?.to,
    message?.call?.to,
    message?.destination?.number,
    call?.destination?.number
  ];
  for (const source of possibleSources){
    if (source && typeof source === 'string' && source.startsWith('+')) {
      console.log('Found VAPI phone number from fallback source:', source);
      return source;
    }
  }
  // Method 4: Use default Hope Hall phone if nothing found
  console.log('No VAPI phone found, using Hope Hall default');
  return '+17747711584';
}

// NEW: Extract organization ID directly from VAPI payload
function extractOrganizationId(message, call) {
  console.log('=== EXTRACTING ORGANIZATION ID ===');
  // Method 1: From call.orgId (most reliable based on your payload)
  if (call?.orgId) {
    console.log('Found org ID from call.orgId:', call.orgId);
    return call.orgId;
  }
  // Method 2: From phoneNumber.orgId
  if (message?.phoneNumber?.orgId) {
    console.log('Found org ID from phoneNumber.orgId:', message.phoneNumber.orgId);
    return message.phoneNumber.orgId;
  }
  // Method 3: From call context
  if (call?.organizationId) {
    console.log('Found org ID from call.organizationId:', call.organizationId);
    return call.organizationId;
  }
  console.log('No org ID found in payload');
  return null;
}

// ENHANCED: More accurate name extraction from speech.
function extractClientNameFromTranscript(speech, clientName) {
  if (clientName && clientName.toLowerCase() !== 'client' && clientName.toLowerCase() !== 'unknown') {
    return clientName;
  }
  if (!speech) return '';
  const patterns = [
    /my name is\s+([a-zA-Z\s]+)/i,
    /i'm\s+([a-zA-Z\s]+)/i,
    /this is\s+([a-zA-Z\s]+)/i,
    /it's\s+([a-zA-Z\s]+)/i,
    /I am\s+([a-zA-Z\s]+)/i
  ];
  for (const pattern of patterns){
    const match = speech.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.toLowerCase() !== 'client' && name.toLowerCase() !== 'unknown' && name.split(' ').length <= 3) {
        return name;
      }
    }
  }
  return '';
}

// ENHANCED: Lead creation with alternative identifiers
async function createLeadWithContext(supabase, organizationId, phoneResult, venueConfig) {
  try {
    const { phone, context } = phoneResult;
    console.log('Creating lead with context:', context.type);
    let leadData = {
      organization_id: organizationId,
      lead_source: `VAPI ${context.type.charAt(0).toUpperCase() + context.type.slice(1)} Contact`,
      current_stage: 'New',
      venue_name: venueConfig?.venue_name || 'Venue'
    };
    // Context-specific lead data
    switch(context.type){
      case 'phone':
        leadData.lead_name = 'Phone Lead';
        leadData.phone = phone;
        leadData.notes = 'Lead automatically created from phone call via VAPI';
        break;
      case 'chat':
        leadData.lead_name = 'Web Chat Lead';
        leadData.phone = phone; // This will be the session identifier
        leadData.notes = `Lead automatically created from web chat via VAPI. Session: ${context.sessionId}`;
        leadData.email = null; // Chat leads often don't have phone/email initially
        break;
      case 'web':
        leadData.lead_name = 'Website Lead';
        leadData.phone = phone; // This will be the session identifier
        leadData.notes = `Lead automatically created from website interaction via VAPI. Session: ${context.sessionId}`;
        break;
    }
    const { error: newLeadError } = await supabase.from('leads').upsert(leadData, {
      onConflict: 'phone,organization_id',
      ignoreDuplicates: true
    });
    if (newLeadError && newLeadError.code !== '23505') {
      console.error('Error creating context-aware lead:', newLeadError);
    } else {
      console.log('✅ Context-aware lead created:', context.type, phone);
    }
  } catch (error) {
    console.error('Error in createLeadWithContext:', error);
  }
}

// FINAL FIX: This is the definitive function to handle call log creation and prevent duplicates.
export async function handleCallStartOnce(supabase, call, message, phoneResult, organizationId, venueConfig, leadProfileResult) {
  try {
    // This is the most important change: We MUST have a consistent callId.
    const callId = call?.id || message?.call?.id || `call-unresolved-${Date.now()}`;
    console.log('=== HANDLE CALL START (FINALIZED UPSERT LOGIC) ===');
    console.log('Processing consistent call_id:', callId);
    // Use a single, atomic UPSERT operation.
    // This will create the log if it doesn't exist or do nothing if it does.
    const { error: upsertError } = await supabase.from('call_logs').upsert({
      call_id: callId,
      organization_id: organizationId,
      caller_phone: phoneResult.phone,
      call_status: 'in_progress',
      interaction_type: phoneResult.context.type,
      session_identifier: phoneResult.context.sessionId,
      context_metadata: phoneResult.context,
      ai_summary: 'Call initiated.',
      transcription: 'Call in progress...'
    }, {
      onConflict: 'call_id, organization_id',
      ignoreDuplicates: true // This is key: if call_id/org_id exists, do nothing.
    });
    if (upsertError) {
      // We only log the error, but don't re-throw, as this shouldn't stop the call.
      console.error('Error during initial call log upsert:', upsertError);
      return; // Exit if we can't create the initial log.
    }
    // Now that a log is guaranteed to exist, associate the lead.
    if (phoneResult.phone && phoneResult.phone !== 'unknown') {
      let leadId = null;
      let clientName = 'Phone Lead';
      const { data: existingLead, error: leadError } = await supabase.from('leads').select('id, lead_name').eq('phone', phoneResult.phone).eq('organization_id', organizationId).order('created_at', {
        ascending: false
      }).limit(1).single();
      if (!leadError && existingLead) {
        leadId = existingLead.id;
        clientName = existingLead.lead_name;
      } else {
        if (leadProfileResult && leadProfileResult !== 'UNKNOWN_CALLER') {
          const leadInfo = leadProfileResult.replace('RETURNING_CALLER: ', '');
          const [name] = leadInfo.split(' - ');
          if (name && name.trim() !== 'UNKNOWN_CALLER') {
            clientName = name.trim();
          }
        }
        const { data: newLead, error: createError } = await supabase.from('leads').insert({
          organization_id: organizationId,
          lead_name: clientName,
          phone: phoneResult.phone,
          lead_source: 'VAPI Phone Call',
          current_stage: 'New',
          venue_name: venueConfig?.venue_name || 'Venue'
        }).select('id, lead_name').single();
        if (!createError && newLead) {
          leadId = newLead.id;
        }
      }
      if (leadId) {
        await supabase.from('call_logs').update({
          lead_id: leadId,
          client_name: clientName
        }).eq('call_id', callId).eq('organization_id', organizationId);
      }
    }
  } catch (error) {
    console.error('Error in handleCallStartOnce:', error);
  }
}

// NEW: Track tool calls in call log
async function trackToolCall(supabase, call, toolCall, organizationId) {
  try {
    const callId = call?.id || `call-${Date.now()}`;
    console.log('Tracking tool call for call_id:', callId);
    // Get current function_calls_made array
    const { data: callLog, error: fetchError } = await supabase.from('call_logs').select('function_calls_made').eq('call_id', callId).eq('organization_id', organizationId).single();
    let currentCalls = [];
    if (fetchError) {
      console.log('Call log not found for tool tracking, skipping...');
      // Don't create new call log here - let handleCallStartOnce handle it
      return;
    } else {
      // Use existing function_calls_made array
      currentCalls = callLog.function_calls_made || [];
    }
    // Add new tool call to array in VAPI format
    const newToolCall = {
      id: toolCall.id,
      type: toolCall.type || 'function',
      function: {
        name: toolCall.function?.name,
        arguments: toolCall.function?.arguments
      }
    };
    currentCalls.push(newToolCall);
    // Update existing call log
    const { error: updateError } = await supabase.from('call_logs').update({
      function_calls_made: currentCalls
    }).eq('call_id', callId).eq('organization_id', organizationId);
    if (updateError) {
      console.error('Error updating function_calls_made:', updateError);
    } else {
      console.log('✅ Tool call tracked:', toolCall.function?.name);
    }
  } catch (error) {
    console.error('Error in trackToolCall:', error);
  }
}

// REFINED: Robust handling of the log_hall_calls function.
async function handleLogHallCalls(supabase, args, organizationId, venueConfig, call) {
  const callId = call?.id || `call-${Date.now()}`;
  const { clientName, callSummary, phoneNumber, followUpType } = args;
  if (!clientName || !callSummary || !phoneNumber) {
    return "Error: Missing required information. I need a name, phone number, and summary to log the call.";
  }
  const callOutcome = followUpType === 'tour_scheduled' ? 'Tour Scheduled' : followUpType === 'information_only' ? 'Information Provided' : followUpType === 'not_interested' ? 'Not Interested' : 'Follow-up Required';
  try {
    // Update the call log
    await supabase.from('call_logs').update({
      client_name: clientName,
      ai_summary: callSummary,
      call_outcome: callOutcome
    }).eq('call_id', callId).eq('organization_id', organizationId);
    // Upsert the lead
    const leadData = {
      organization_id: organizationId,
      lead_name: clientName,
      phone: phoneNumber,
      lead_source: 'VAPI Phone Call',
      notes: callSummary,
      venue_name: venueConfig?.venue_name,
      follow_up_required: callOutcome === 'Follow-up Required'
    };
    const leadScore = calculateLeadScore(args);
    await supabase.from('leads').upsert({
      ...leadData,
      lead_score: leadScore,
      lead_category: leadScore >= 75 ? 'HOT' : leadScore >= 60 ? 'WARM' : 'COOL'
    }, {
      onConflict: 'phone,organization_id'
    });
    return `Call logged successfully for ${clientName}.`;
  } catch (error) {
    console.error('Error in handleLogHallCalls:', error);
    return 'Error processing call details.';
  }
}

// ENHANCED: Tour scheduling function
export async function handleScheduleVenueTour(supabase, args, organizationId, venueConfig, transcript) {
  console.log('--- Enhanced handleScheduleVenueTour with validation ---');
  
  const { clientName, phoneNumber, email, eventType, eventDate, guestCount, 
          preferredTourDateTime, requestedDay, requestedTime } = args;
  
  // Step 1: Validate that we have the minimum information needed
  if (!requestedDay && !preferredTourDateTime) {
    return "I'd be happy to schedule your tour! When would you like to visit? What day and time work best for you?";
  }
  
  if (!requestedTime && !preferredTourDateTime) {
    return "I have the day you'd like to visit. What time would work best for your tour?";
  }
  
  // Step 2: Extract and validate client information
  const finalClientName = extractClientNameFromTranscript(transcript, clientName);
  
  if (!finalClientName || finalClientName === 'Client' || finalClientName === 'Unknown') {
    return "I need a name to schedule the tour. Could you please tell me your name?";
  }
  
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    return "I need a phone number to schedule the tour. What's the best number to reach you?";
  }
  
  // Step 3: Parse date and time with enhanced error handling
  let dateResult, timeResult;
  
  try {
    if (preferredTourDateTime) {
      // Handle ISO datetime format
      const dateTime = new Date(preferredTourDateTime);
      if (isNaN(dateTime.getTime())) {
        return "I couldn't understand that date and time. Please try again with a format like 'tomorrow at 2 PM'.";
      }
      
      const dbDate = dateTime.toISOString().split('T')[0];
      const dbTime = dateTime.toTimeString().split(' ')[0];
      
      dateResult = { dbDate, targetDate: dateTime };
      timeResult = { dbTime, displayTime: dateTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true 
      })};
    } else {
      // Parse separate day and time with validation
      dateResult = USE_ENHANCED_PARSING ? 
        parseRequestedDateEnhanced(requestedDay) : 
        parseRequestedDate(requestedDay);
      
      if (dateResult.validationMessage) {
        return dateResult.validationMessage;
      }
      
      timeResult = USE_ENHANCED_PARSING ? 
        parseRequestedTime(requestedTime) : 
        parseRequestedTimeOriginal(requestedTime);
      
      if (timeResult.validationMessage) {
        return timeResult.validationMessage;
      }
    }
  } catch (error) {
    console.error('Error in date/time parsing:', error);
    return "I had trouble understanding the date and time. Could you please tell me when you'd like to schedule your tour using a format like 'this Friday at 2 PM'?";
  }
  
  // Step 4: Get Lead Profile
  const { data: lead } = await supabase.from('leads').select('id, lead_name, email').eq('phone', phoneNumber).eq('organization_id', organizationId).single();
  
  // Step 5: Schedule the tour
  const tourDateStr = dateResult.dbDate || dateResult.targetDate?.toISOString().split('T')[0];
  const tourTimeStr = timeResult.dbTime;
  
  const { error: tourError } = await supabase.from('tours').insert({
    organization_id: organizationId,
    lead_id: lead?.id,
    tour_date: tourDateStr,
    tour_time: tourTimeStr,
    tour_status: 'scheduled'
  });
  
  if (tourError) {
    console.error('Error scheduling tour:', tourError);
    return "I'm sorry, I wasn't able to schedule your tour at this time. Please try again later.";
  }
  
  // Step 6: Confirmation
  const targetDate = dateResult.targetDate || new Date(tourDateStr);
  const confirmationMessage = `Perfect! I've scheduled your tour for ${targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })} at ${timeResult.displayTime || timeResult.time}.`;
  
  if (!email) {
    return `${confirmationMessage} What is the best email to send the confirmation to?`;
  }
  
  return `${confirmationMessage} I've sent a confirmation to ${email}.`;
}

async function handleCheckVenueAvailability(supabase, args, organizationId, venueConfig) {
  console.log('=== HANDLE CHECK VENUE AVAILABILITY ===');
  console.log('Args received:', args);
  const { eventDate, guestCount } = args;
  console.log('Checking venue availability for:', {
    eventDate,
    organizationId
  });
  try {
    // A venue is considered unavailable if there is ANY booking (pending, confirmed, etc.)
    // unless it is explicitly 'cancelled'.
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, event_status, event_name')
      .eq('organization_id', organizationId)
      .eq('event_date', eventDate)
      .not('event_status', 'in', ['cancelled', 'Cancelled']); // Fixed: Use array instead of string
    if (error) {
      console.error('Error checking venue bookings for availability:', error);
      return "I'm having trouble checking venue availability. Please try again.";
    }
    const isAvailable = !bookings || bookings.length === 0;
    console.log('Venue availability check result:', {
      isAvailable,
      bookingsCount: bookings?.length || 0
    });
    if (!isAvailable) {
      const eventName = bookings[0].event_name || 'a private event';
      return `I'm sorry, but that date is already booked for ${eventName}. Would you like to check a different date?`;
    }
    // Also check for tours, as a day full of tours might be considered busy.
    const { data: tours } = await supabase.from('tours').select('id').eq('organization_id', organizationId).eq('tour_date', eventDate).in('tour_status', [
      'scheduled',
      'confirmed'
    ]);
    const hasScheduledTours = tours && tours.length > 0;
    console.log('Tours check result:', {
      hasScheduledTours,
      toursCount: tours?.length || 0
    });
    const pricingInfo = venueConfig?.venue_pricing || {};
    const date = new Date(eventDate);
    const dayOfWeek = date.toLocaleDateString('en-US', {
      weekday: 'long'
    }).toLowerCase();
    
    // NEW: Use daily pricing structure
    let price = pricingInfo.weekday || 1500;
    const dayKey = dayOfWeek as keyof typeof pricingInfo;
    if (pricingInfo[dayKey] && pricingInfo[dayKey] !== null) {
      price = pricingInfo[dayKey];
    } else {
      // Fallback to legacy pricing structure
      if (dayOfWeek === 'saturday') {
        price = pricingInfo.saturday || pricingInfo.weekend || 3000;
      } else if (dayOfWeek === 'friday' || dayOfWeek === 'sunday') {
        price = pricingInfo.friday_sunday || 2500;
      } else {
        price = pricingInfo.weekday || 1500;
      }
    }
    
    const result = {
      available: true,
      venue_name: venueConfig?.venue_name || 'Venue',
      capacity: venueConfig?.venue_capacity || 300,
      pricing: {
        ...pricingInfo,
        price_for_date: price,
        day_of_week: dayOfWeek
      },
      features: venueConfig?.venue_features || [],
      has_tours_scheduled: hasScheduledTours
    };
    console.log('Venue availability result:', result);
    return result;
  } catch (err) {
    console.error('Critical error in handleCheckVenueAvailability:', err);
    return "I've encountered an error checking for venue availability. Please try another date or try again later.";
  }
}

async function handleProvidePricingInfo(supabase, args, organizationId, venueConfig) {
  console.log('=== HANDLE PROVIDE PRICING INFO (ENHANCED) ===');
  console.log('Args received:', args);
  const { eventDate, eventType, guestCount } = args;
  const pricing = venueConfig?.venue_pricing || {};
  const features = venueConfig?.venue_features || [];
  
  // ENHANCED: Calculate specific pricing for the date using daily pricing
  let dayType = 'weekday';
  let specificPrice = pricing.weekday || 1500;
  let dayName = 'weekday';
  
  if (eventDate) {
    const date = new Date(eventDate);
    const dayOfWeek = date.toLocaleDateString('en-US', {
      weekday: 'long'
    }).toLowerCase();
    
    // NEW: Use daily pricing structure
    const dayKey = dayOfWeek as keyof typeof pricing;
    if (pricing[dayKey] && pricing[dayKey] !== null) {
      specificPrice = pricing[dayKey];
      dayName = dayOfWeek;
      dayType = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    } else {
      // Fallback to legacy pricing structure
      if (dayOfWeek === 'saturday') {
        dayType = 'Saturday';
        specificPrice = pricing.saturday || pricing.weekend || 3000;
      } else if (dayOfWeek === 'friday' || dayOfWeek === 'sunday') {
        dayType = 'Friday/Sunday';
        specificPrice = pricing.friday_sunday || 2500;
      } else {
        dayType = 'weekday';
        specificPrice = pricing.weekday || 1500;
      }
    }
  }
  
  // ENHANCED: Return data that assistant can immediately use
  const response = {
    venue_name: venueConfig?.venue_name || 'The Hope Hall',
    pricing: pricing,
    features: features,
    capacity: venueConfig?.venue_capacity || 300,
    // NEW: Ready-to-use pricing message for the assistant
    pricing_message: `Our venue rental for ${dayType} is $${specificPrice.toLocaleString()}. This includes ${features.length > 0 ? features.slice(0, 3).join(', ') : 'full access to all our amenities'}. Would you like to schedule a tour to see the space?`,
    day_type: dayType,
    day_name: dayName,
    specific_price: specificPrice
  };
  console.log('✅ Enhanced pricing response:', response);
  return response;
}

async function handleGetLeadProfile(supabase, args, organizationId) {
  console.log('=== HANDLE GET LEAD PROFILE ===');
  console.log('Args received:', args);
  const { phoneNumber } = args;
  console.log('Looking up lead profile for phone:', phoneNumber);
  // CHAT CONTEXT FIX: Handle chat sessions without real phone numbers
  if (!phoneNumber || phoneNumber.startsWith('chat-') || phoneNumber.includes('⟦')) {
    console.log('Chat context detected or phone number variable not replaced:', phoneNumber);
    return 'UNKNOWN_CALLER';
  }
  const { data: lead, error } = await supabase.from('leads').select('*').eq('phone', phoneNumber).eq('organization_id', organizationId).order('created_at', {
    ascending: false
  }).limit(1).single();
  if (error || !lead) {
    console.log('No lead found for phone:', phoneNumber);
    return 'UNKNOWN_CALLER';
  }
  const result = `RETURNING_CALLER: ${lead.lead_name} - ${lead.event_type} on ${lead.event_date}`;
  console.log('Lead profile result:', result);
  return result;
}

function calculateLeadScore(leadData) {
  let score = 0;
  // Base score for having contact info
  if (leadData.phone) score += 20;
  if (leadData.email) score += 15;
  // Event type scoring
  if (leadData.event_type === 'Wedding') score += 25;
  else if (leadData.event_type === 'Quinceañera') score += 20;
  else score += 10;
  // Guest count scoring
  if (leadData.guest_count && leadData.guest_count > 100) score += 20;
  else if (leadData.guest_count && leadData.guest_count > 50) score += 15;
  else score += 10;
  // Date proximity scoring
  if (leadData.event_date) {
    const eventDate = new Date(leadData.event_date);
    const now = new Date();
    const monthsUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsUntilEvent < 3) score += 25;
    else if (monthsUntilEvent < 6) score += 15;
    else score += 5;
  }
  return Math.min(score, 100);
}

// FINAL FIX: This is the definitive function to handle call finalization.
export async function handleCallEnd(supabase, call, message, organizationId, venueConfig, callerPhone) {
  try {
    // This is the most important change: We MUST have a consistent callId.
    const callId = call?.id || message?.call?.id || `call-unresolved-${Date.now()}`;
    console.log('=== HANDLE CALL END (FINALIZED UPSERT LOGIC) ===');
    console.log('Finalizing consistent call_id:', callId);
    const transcript = message?.transcript || call?.transcript || 'No transcript available';
    const callDuration = Math.round(parseFloat(String(call?.duration || message?.durationSeconds || 0)));
    const recordingUrl = call?.recordingUrl || message?.recordingUrl || '';
    const aiSummary = message?.analysis?.summary || message?.summary || `Call completed. Duration: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`;
    // Get lead information if available to associate with the call.
    let leadId = null;
    let clientName = null;
    if (callerPhone && callerPhone !== 'unknown') {
      const { data: lead } = await supabase.from('leads').select('id, lead_name').eq('phone', callerPhone).eq('organization_id', organizationId).order('created_at', {
        ascending: false
      }).limit(1).single();
      if (lead) {
        leadId = lead.id;
        clientName = lead.lead_name;
      }
    }
    const finalLogData = {
      call_id: callId,
      organization_id: organizationId,
      caller_phone: callerPhone,
      call_status: 'completed',
      call_duration: callDuration,
      transcription: transcript,
      call_recording_url: recordingUrl,
      ai_summary: aiSummary,
      sentiment_score: message?.analysis?.sentiment?.score || 0
    };
    if (leadId) finalLogData.lead_id = leadId;
    if (clientName) finalLogData.client_name = clientName;
    // Use a single, atomic UPSERT operation.
    const { error: upsertError } = await supabase.from('call_logs').upsert(finalLogData, {
      onConflict: 'call_id, organization_id',
      ignoreDuplicates: false // We want to UPDATE the existing record here.
    });
    if (upsertError) {
      console.error('Error finalizing call log:', upsertError);
    } else {
      console.log('✅ Call log finalized successfully for call_id:', callId);
    }

    // ========================================
    // VENUEVOICE.AI: TRACK USAGE FOR BILLING
    // ========================================
    try {
      console.log('--- Tracking call usage for billing ---');
      const usageResult = await trackCallUsage(
        supabase,
        organizationId,
        callDuration,
        callId
      );

      if (usageResult.success) {
        console.log('✅ Usage tracked:', usageResult.message);

        // Log warning if approaching limits
        if (usageResult.warningLevel === 'approaching' ||
            usageResult.warningLevel === 'exceeded' ||
            usageResult.warningLevel === 'hard_limit') {
          console.warn('⚠️ USAGE WARNING:', usageResult.message);
          // TODO: Send notification to organization owner
        }
      } else {
        console.error('❌ Usage tracking failed:', usageResult.message);
      }
    } catch (usageError) {
      console.error('Error tracking usage (non-blocking):', usageError);
      // Don't throw - usage tracking failure shouldn't break call logging
    }
    // ========================================

  } catch (error) {
    console.error('Critical error in handleCallEnd:', error);
  }
}

// COMPLETED: Send to enrichment webhook for N8N processing
// Helper function to get organization-specific N8N webhook URL
async function getOrganizationWebhookUrl(supabase, organizationId) {
  try {
    const { data: integration, error } = await supabase.from('organization_integrations').select('configuration').eq('organization_id', organizationId).eq('integration_type', 'n8n').eq('is_active', true).single();
    if (error || !integration) {
      console.log('No custom N8N webhook found for organization:', organizationId);
      return null;
    }
    const webhookUrl = integration.configuration?.webhook_url;
    if (!webhookUrl) {
      console.log('N8N integration found but no webhook URL configured for organization:', organizationId);
      return null;
    }
    console.log('Found custom N8N webhook for organization:', organizationId);
    return webhookUrl;
  } catch (error) {
    console.error('Error fetching organization N8N webhook:', error);
    return null;
  }
}

async function sendToEnrichmentWebhook(supabase, call, message, organizationId, venueConfig, callerPhone) {
  try {
    console.log('=== SENDING TO ENRICHMENT WEBHOOK ===');
    // FIXED: Ensure we always have a call_id
    const callId = call?.id || message?.call?.id || message?.callId || `call-${Date.now()}`;
    console.log('Using call_id for enrichment:', callId);
    // Extract call data for enrichment
    const transcript = message?.transcript || call?.transcript || message?.artifact?.messages?.map((m)=>`${m.role}: ${m.message || m.content || ''}`).join('\n') || 'No transcript available';
    const callDuration = call?.duration || message?.durationSeconds || 0;
    const callCost = call?.cost || message?.cost || 0;
    const recordingUrl = call?.recordingUrl || message?.recordingUrl || '';
    // Get lead information if available
    const { data: lead } = await supabase.from('leads').select('*').eq('phone', callerPhone).eq('organization_id', organizationId).order('created_at', {
      ascending: false
    }).limit(1).single();
    // Get call log information using the determined call_id
    const { data: callLog } = await supabase.from('call_logs').select('*').eq('call_id', callId).eq('organization_id', organizationId).single();
    // If no call log found by call_id, try to find by phone and recent timestamp
    let finalCallLog = callLog;
    if (!callLog && callerPhone) {
      console.log('No call log found by call_id, searching by phone and recent timestamp');
      const { data: recentCallLog } = await supabase.from('call_logs').select('*').eq('caller_phone', callerPhone).eq('organization_id', organizationId).order('created_at', {
        ascending: false
      }).limit(1).single();
      finalCallLog = recentCallLog;
      console.log('Found recent call log:', !!recentCallLog);
    }
    // Prepare enrichment payload for N8N
    const enrichmentPayload = {
      call_id: callId,
      organization_id: organizationId,
      caller_phone: callerPhone,
      transcript: transcript,
      call_duration: callDuration,
      call_cost: callCost,
      recording_url: recordingUrl,
      lead_data: lead || null,
      call_log_data: finalCallLog || null,
      call_timestamp: new Date().toISOString(),
      enrichment_type: 'vapi_call_end',
      venue_info: {
        venue_name: venueConfig?.venue_name || 'Venue',
        organization_id: organizationId
      }
    };
    console.log('Enrichment payload prepared:', {
      call_id: callId,
      transcript_length: transcript.length,
      lead_found: !!lead,
      call_log_found: !!finalCallLog
    });
    // Get organization-specific N8N webhook URL
    const organizationWebhookUrl = await getOrganizationWebhookUrl(supabase, organizationId);
    const webhookUrl = organizationWebhookUrl || Deno.env.get('ENRICHMENT_WEBHOOK_URL') || 'https://n8n.lawonecloud.com/webhook/hope-hall-vapi-enrichment';
    console.log('Using webhook URL:', organizationWebhookUrl ? 'Organization-specific' : 'Default');
    console.log('Webhook URL:', webhookUrl);
    // Send to N8N enrichment webhook with timeout and better error handling
    try {
      const enrichmentResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrichmentPayload),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      if (enrichmentResponse.ok) {
        console.log('✅ Successfully sent to enrichment webhook with call_id:', callId);
      } else {
        console.error('❌ Failed to send to enrichment webhook:', enrichmentResponse.status, enrichmentResponse.statusText);
        console.error('Response body:', await enrichmentResponse.text());
      }
    } catch (fetchError) {
      console.error('❌ Network error sending to enrichment webhook:', fetchError);
    // Don't throw - enrichment failure shouldn't break the main call flow
    }
  } catch (error) {
    console.error('Error sending to enrichment webhook:', error);
  // Don't throw - enrichment failure shouldn't break the main call flow
  }
}

// SIMPLIFIED: Phone extraction with proper VAPI payload handling
async function extractPhone(supabase, reqMessage, callObj, fallbackCallId) {
  console.log('=== EXTRACTING PHONE NUMBER (VAPI SIMPLIFIED) ===');
  // Priority 1: `call.customer.number` - The actual caller's number
  const customerNumber = callObj?.customer?.number || reqMessage?.call?.customer?.number;
  if (customerNumber && customerNumber.startsWith('+')) {
    const context = detectInteractionContext(reqMessage, callObj, customerNumber);
    console.log('Found phone from call.customer.number:', customerNumber);
    return {
      phone: customerNumber,
      context
    };
  }
  // Priority 2: `call.from` - Also a reliable source for the caller's number
  const fromNumber = callObj?.from || reqMessage?.call?.from;
  if (fromNumber && fromNumber.startsWith('+')) {
    const context = detectInteractionContext(reqMessage, callObj, fromNumber);
    console.log('Found phone from call.from:', fromNumber);
    return {
      phone: fromNumber,
      context
    };
  }
  // Fallback for tool calls where the number might be in the arguments
  if (reqMessage?.toolCalls) {
    for (const toolCall of reqMessage.toolCalls){
      if (toolCall.function?.arguments) {
        try {
          const args = typeof toolCall.function.arguments === 'string' ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
          const phoneInArgs = args.phoneNumber || args.phone || args.callerPhone;
          if (phoneInArgs && phoneInArgs.startsWith('+')) {
            const context = detectInteractionContext(reqMessage, callObj, phoneInArgs);
            console.log('Found phone in tool args:', phoneInArgs);
            return {
              phone: phoneInArgs,
              context
            };
          }
        } catch (e) {
        // Ignore parsing errors
        }
      }
    }
  }
  // If no reliable phone number is found, generate an identifier
  console.log('No reliable phone number found, generating identifier.');
  const context = detectInteractionContext(reqMessage, callObj, '');
  return {
    phone: context.identifier,
    context
  };
}

// Data validation utilities
const validators = {
  phoneNumber: (phone)=>{
    return Boolean(phone && (phone.startsWith('+') || /^\d{10,15}$/.test(phone) || phone.includes('session') || phone.includes('chat')));
  },
  email: (email)=>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  date: (dateString)=>{
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date > new Date();
  },
  eventType: (eventType)=>{
    const validTypes = [
      'Wedding',
      'Birthday',
      'Quinceañera',
      'Corporate',
      'Anniversary',
      'Other'
    ];
    return validTypes.includes(eventType);
  },
  guestCount: (count)=>{
    const num = parseInt(count);
    return !isNaN(num) && num > 0 && num <= 1000;
  }
};

// Tool call argument validator
function validateToolCallArguments(functionName, args) {
  console.log(`Validating arguments for ${functionName}:`, args);
  switch(functionName){
    case 'getLeadProfile':
      if (!args.phoneNumber) {
        throw new WebhookError('phoneNumber is required for getLeadProfile', 400, 'MISSING_PHONE_NUMBER', {
          function: functionName,
          args
        });
      }
      break;
    case 'scheduleVenueTour':
      if (!args.clientName || args.clientName === 'Client') {
        throw new WebhookError('Valid client name is required for tour scheduling', 400, 'MISSING_CLIENT_NAME', {
          function: functionName,
          args
        });
      }
      if (!validators.phoneNumber(args.phoneNumber)) {
        throw new WebhookError('Valid phone number is required for tour scheduling', 400, 'INVALID_PHONE_NUMBER', {
          function: functionName,
          args
        });
      }
      // ADD ENHANCED VALIDATION FOR REQUESTED DAY
      if (!args.requestedDay && !args.preferredTourDateTime) {
        throw new WebhookError('requestedDay or preferredTourDateTime is required for tour scheduling', 400, 'MISSING_REQUESTED_DAY', {
          function: functionName,
          args
        });
      }
      break;
    case 'checkVenueAvailability':
      if (!args.eventDate || !validators.date(args.eventDate)) {
        throw new WebhookError('Valid future event date is required for availability check', 400, 'INVALID_EVENT_DATE', {
          function: functionName,
          args
        });
      }
      break;
    case 'log_hall_calls':
      if (!args.clientName || !args.phoneNumber || !args.callSummary) {
        throw new WebhookError('clientName, phoneNumber, and callSummary are required for call logging', 400, 'MISSING_REQUIRED_FIELDS', {
          function: functionName,
          args,
          missing: {
            clientName: !args.clientName,
            phoneNumber: !args.phoneNumber,
            callSummary: !args.callSummary
          }
        });
      }
      break;
  }
  console.log(`✅ Arguments validated for ${functionName}`);
}

// Database operation wrapper with validation
async function safeDatabaseOperation(operation, operationName, expectedCount) {
  return withErrorHandling(async ()=>{
    const result = await operation();
    if (result.error) {
      throw new WebhookError(`Database operation failed: ${result.error.message}`, 500, 'DATABASE_OPERATION_FAILED', {
        operation: operationName,
        error: result.error,
        code: result.error.code
      });
    }
    if (expectedCount !== undefined) {
      const actualCount = Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0;
      if (actualCount !== expectedCount) {
        throw new WebhookError(`Database operation returned unexpected count: expected ${expectedCount}, got ${actualCount}`, 500, 'UNEXPECTED_RESULT_COUNT', {
          operation: operationName,
          expected: expectedCount,
          actual: actualCount,
          data: result.data
        });
      }
    }
    return result.data;
  }, `database operation: ${operationName}`);
}

// SIMPLIFIED: Organization resolution using the VAPI phone number
async function getValidatedOrganizationId(supabase, message, call, vapiPhoneNumber) {
  return withErrorHandling(async ()=>{
    console.log('=== RESOLVING ORGANIZATION ID (SIMPLIFIED) ===');
    if (!vapiPhoneNumber || !vapiPhoneNumber.startsWith('+')) {
      throw new WebhookError('A valid VAPI phone number is required for organization resolution', 400, 'MISSING_VAPI_PHONE');
    }
    console.log('Resolving organization for VAPI phone:', vapiPhoneNumber);
    const { data: phoneMapping, error: mappingError } = await supabase.from('phone_organization_mapping').select('organization_id').eq('phone_number', vapiPhoneNumber).eq('is_active', true).single();
    if (mappingError) {
      throw new WebhookError(`No active phone mapping found for: ${vapiPhoneNumber}`, 404, 'PHONE_MAPPING_NOT_FOUND', {
        vapi_phone: vapiPhoneNumber
      });
    }
    if (!phoneMapping?.organization_id) {
      throw new WebhookError(`Phone mapping for ${vapiPhoneNumber} is missing an organization_id`, 500, 'INVALID_PHONE_MAPPING');
    }
    console.log('✅ Organization resolved via phone mapping:', phoneMapping.organization_id);
    return phoneMapping.organization_id;
  }, 'resolve organization ID via phone mapping');
}

// Enhanced logging for successful interactions
function logSuccessfulInteraction(requestedDay, requestedTime, result) {
  console.log('✅ SUCCESSFUL INTERACTION:', {
    input: { requestedDay, requestedTime },
    output: typeof result === 'string' ? result.substring(0, 100) + '...' : 'Object returned',
    timestamp: new Date().toISOString(),
    language_detected: detectLanguage(requestedDay + ' ' + requestedTime),
    parsing_method: USE_ENHANCED_PARSING ? 'enhanced' : 'original'
  });
}

function detectLanguage(text) {
  const spanishWords = ['mañana', 'hoy', 'las', 'nueve', 'ocho', 'tarde', 'noche', 'viernes', 'sábado', 'domingo', 'lunes', 'martes', 'miércoles', 'jueves'];
  const hasSpanish = spanishWords.some(word => text.toLowerCase().includes(word));
  return hasSpanish ? 'spanish' : 'english';
}

// Real Contact Information Database
// 🚨 URGENT: Add actual venue contact information to prevent fake phone numbers
const venueContactInfo = {
  phone: "+17747711584", // Real Hope Hall number
  email: "info@hopehall.com", // Real email
  address: "5617 54th Ave, Riverdale Park, MD 20737" // Real address
};

// Date Consistency Validation
// 🚨 HIGH PRIORITY: Add validation to ensure AI responses match function outputs
function validateDateConsistency(functionDate, aiResponse) {
  if (functionDate && !aiResponse.includes(functionDate)) {
    console.error('🚨 DATE MISMATCH DETECTED:', { functionDate, aiResponse });
    return false;
  }
  return true;
}