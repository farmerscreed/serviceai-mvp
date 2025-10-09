'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Database, CheckCheck, Sparkles, ArrowLeft } from 'lucide-react'

interface ValidationResult {
  industry_code: string
  language_code: string
  valid: boolean
  errors: string[]
  warnings: string[]
}

export default function TemplatesAdminPage() {
  const [seeding, setSeeding] = useState(false)
  const [validating, setValidating] = useState(false)
  const [seedResult, setSeedResult] = useState<any>(null)
  const [validateResult, setValidateResult] = useState<any>(null)

  const handleSeed = async () => {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/templates/seed', { method: 'POST' })
      const json = await res.json()
      setSeedResult(json)
    } catch (e: any) {
      setSeedResult({ success: false, error: e?.message || 'Unknown error' })
    } finally {
      setSeeding(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    setValidateResult(null)
    try {
      const res = await fetch('/api/templates/validate')
      const json = await res.json()
      setValidateResult(json)
    } catch (e: any) {
      setValidateResult({ success: false, error: e?.message || 'Unknown error' })
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Industry Templates</h1>
          <p className="text-lg text-gray-600">Manage and validate your AI assistant templates</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Seed Templates Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Seed Templates</h2>
                <p className="text-sm text-gray-600">Load templates into database</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Import HVAC, Plumbing, and Electrical templates in English and Spanish. This will create or update templates with emergency keywords, SMS templates, and cultural guidelines.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Seeding Templates...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Seed Templates
                </>
              )}
            </button>
          </div>

          {/* Validate Templates Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Validate Templates</h2>
                <p className="text-sm text-gray-600">Check template integrity</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Verify all templates have required fields, emergency keywords in both languages, SMS templates, and proper configuration. Identifies missing or invalid data.
            </p>
            <button
              onClick={handleValidate}
              disabled={validating}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCheck className="w-5 h-5" />
                  Validate Templates
                </>
              )}
            </button>
          </div>
        </div>

        {/* Seed Result */}
        {seedResult && (
          <div className={`rounded-2xl shadow-lg border p-8 mb-8 ${
            seedResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {seedResult.success ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <h3 className={`text-xl font-bold ${
                seedResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {seedResult.success ? 'Templates Seeded Successfully' : 'Seeding Failed'}
              </h3>
            </div>
            {seedResult.success ? (
              <div className="space-y-2">
                <p className="text-green-800 font-medium">
                  ✓ {seedResult.inserted} templates inserted/updated
                </p>
                {seedResult.items && seedResult.items.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {seedResult.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-green-700 bg-green-100 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">{item.industry_code}</span>
                        <span className="text-green-600">({item.language_code})</span>
                        <span className="text-green-600">v{item.version}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-800">{seedResult.error || 'An error occurred'}</p>
            )}
          </div>
        )}

        {/* Validation Result */}
        {validateResult && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              {validateResult.valid ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              )}
              <h3 className={`text-xl font-bold ${
                validateResult.valid ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {validateResult.valid ? 'All Templates Valid' : 'Validation Issues Found'}
              </h3>
            </div>

            {validateResult.results && validateResult.results.length > 0 ? (
              <div className="space-y-4">
                {validateResult.results.map((result: ValidationResult, idx: number) => (
                  <div
                    key={idx}
                    className={`rounded-xl border-2 p-5 transition-all ${
                      result.valid
                        ? 'border-green-200 bg-green-50'
                        : result.errors.length > 0
                        ? 'border-red-200 bg-red-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {result.valid ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : result.errors.length > 0 ? (
                          <XCircle className="w-6 h-6 text-red-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {result.industry_code} ({result.language_code})
                          </h4>
                        </div>
                      </div>
                      {result.valid && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Valid
                        </span>
                      )}
                    </div>

                    {result.errors.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-red-900 mb-2">Errors:</p>
                        <ul className="space-y-1">
                          {result.errors.map((error, i) => (
                            <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.warnings.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 mb-2">Warnings:</p>
                        <ul className="space-y-1">
                          {result.warnings.map((warning, i) => (
                            <li key={i} className="text-sm text-yellow-800 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No templates found in database. Please seed templates first.</p>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            About Industry Templates
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Templates include emergency detection patterns for both English and Spanish</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>SMS templates are pre-configured with cultural guidelines for each language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Each industry has appointment types, required fields, and integration requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Templates auto-fallback to English if Spanish version is not available</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
