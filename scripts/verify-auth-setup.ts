#!/usr/bin/env tsx

/**
 * Authentication Setup Verification Script
 * 
 * This script verifies that the authentication system is properly set up.
 * Run with: npx tsx scripts/verify-auth-setup.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

interface CheckResult {
  name: string
  passed: boolean
  message: string
}

const results: CheckResult[] = []

function check(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message })
  const symbol = passed ? '✅' : '❌'
  console.log(`${symbol} ${name}: ${message}`)
}

async function verifyAuthSetup() {
  console.log('🔍 Verifying Authentication Setup...\n')

  // Check 1: Environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  check(
    'Environment Variables',
    !!(supabaseUrl && supabaseKey),
    supabaseUrl && supabaseKey 
      ? 'Supabase credentials found' 
      : 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )

  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Cannot proceed without Supabase credentials.')
    console.log('Please copy env.template to .env.local and add your credentials.\n')
    return
  }

  // Check 2: Required files exist
  const requiredFiles = [
    'lib/supabase/server.ts',
    'lib/supabase/client.ts',
    'lib/supabase/middleware.ts',
    'lib/auth/auth-context.tsx',
    'middleware.ts',
    'app/(auth)/auth/signup/page.tsx',
    'app/(auth)/auth/signin/page.tsx',
    'app/(auth)/auth/reset-password/page.tsx',
    'app/(auth)/auth/callback/route.ts',
    'app/dashboard/page.tsx',
    'app/profile/page.tsx',
    'supabase/migrations/001_create_user_profiles.sql',
  ]

  let allFilesExist = true
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file)
    const exists = fs.existsSync(filePath)
    if (!exists) {
      check('Required Files', false, `Missing: ${file}`)
      allFilesExist = false
    }
  }

  if (allFilesExist) {
    check('Required Files', true, 'All required authentication files exist')
  }

  // Check 3: Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      if (error.message.includes('does not exist')) {
        check(
          'Database Schema',
          false,
          'user_profiles table does not exist. Run the migration in Supabase SQL Editor.'
        )
      } else {
        check('Database Schema', false, `Database error: ${error.message}`)
      }
    } else {
      check('Database Schema', true, 'user_profiles table exists and is accessible')
    }
  } catch (error: any) {
    check('Supabase Connection', false, `Connection failed: ${error.message}`)
  }

  // Check 4: Auth configuration
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.auth.getSession()
    
    if (error && !error.message.includes('session_not_found')) {
      check('Auth Configuration', false, `Auth error: ${error.message}`)
    } else {
      check('Auth Configuration', true, 'Supabase Auth is properly configured')
    }
  } catch (error: any) {
    check('Auth Configuration', false, `Auth check failed: ${error.message}`)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  const passed = results.filter(r => r.passed).length
  const total = results.length
  const percentage = Math.round((passed / total) * 100)

  console.log(`\n📊 Results: ${passed}/${total} checks passed (${percentage}%)`)

  if (passed === total) {
    console.log('\n✅ Authentication setup is complete!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run dev')
    console.log('2. Visit: http://localhost:3000')
    console.log('3. Test sign up and sign in flows')
    console.log('4. Read: docs/AUTH_QUICKSTART.md for testing guide\n')
  } else {
    console.log('\n❌ Authentication setup is incomplete.')
    console.log('\nPlease fix the failed checks above.')
    console.log('See docs/AUTH_QUICKSTART.md for setup instructions.\n')
  }
}

// Run verification
verifyAuthSetup().catch(console.error)


