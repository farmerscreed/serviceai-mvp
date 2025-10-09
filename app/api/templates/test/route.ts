// API Route for Testing Industry Templates
// Task 1.4: Industry Template Definitions

import { NextRequest, NextResponse } from 'next/server'
import { createServerTemplateTesting } from '@/lib/templates/template-testing'

export async function POST(request: NextRequest) {
  try {
    const testing = createServerTemplateTesting()
    
    // Run comprehensive tests
    const results = await testing.runAllTests()
    
    return NextResponse.json({
      success: true,
      test_results: results
    })
  } catch (error) {
    console.error('Template testing error:', error)
    return NextResponse.json({
      success: false,
      message: 'Template testing failed',
      error: String(error)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const testing = createServerTemplateTesting()
    
    // Run individual test suites
    const templateLoading = await testing.testTemplateLoading()
    const languageFallback = await testing.testLanguageFallback()
    const languageDetection = testing.testLanguageDetection()
    
    return NextResponse.json({
      success: true,
      tests: {
        template_loading: templateLoading,
        language_fallback: languageFallback,
        language_detection: languageDetection
      }
    })
  } catch (error) {
    console.error('Template testing error:', error)
    return NextResponse.json({
      success: false,
      message: 'Template testing failed',
      error: String(error)
    }, { status: 500 })
  }
}
