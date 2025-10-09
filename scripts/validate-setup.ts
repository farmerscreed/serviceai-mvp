/**
 * Validation script for development environment setup
 *
 * Checks:
 * - Environment variables are set
 * - Supabase connection works (if configured)
 * - API clients are initialized
 *
 * Run with: npm run validate-setup
 */

// Check if running in Node.js environment
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

if (!isNode) {
  console.error('This script must be run in Node.js environment');
  process.exit(1);
}

async function validateSetup() {
  console.log('🔍 Validating ServiceAI Development Environment...\n');

  let allValid = true;
  const warnings: string[] = [];

  // Check environment variables
  console.log('📋 Checking environment variables...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VAPI_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ];

  const optionalEnvVars = [
    'VAPI_WEBHOOK_SECRET',
    'TWILIO_WEBHOOK_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value === 'your_' + envVar.toLowerCase().replace(/next_public_|supabase_|vapi_|twilio_/g, '') + '_here') {
      console.log(`   ❌ ${envVar} - MISSING OR NOT CONFIGURED`);
      allValid = false;
    } else {
      console.log(`   ✅ ${envVar} - SET`);
    }
  }

  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      warnings.push(`${envVar} not set (will be needed in later tasks)`);
    }
  }

  // Check Node modules
  console.log('\n📦 Checking installed packages...');
  try {
    require.resolve('next');
    console.log('   ✅ Next.js - INSTALLED');
  } catch {
    console.log('   ❌ Next.js - NOT INSTALLED');
    allValid = false;
  }

  try {
    require.resolve('@supabase/supabase-js');
    console.log('   ✅ Supabase JS - INSTALLED');
  } catch {
    console.log('   ❌ Supabase JS - NOT INSTALLED');
    allValid = false;
  }

  try {
    require.resolve('@supabase/ssr');
    console.log('   ✅ Supabase SSR - INSTALLED');
  } catch {
    console.log('   ❌ Supabase SSR - NOT INSTALLED');
    allValid = false;
  }

  // Check Supabase connection (only if credentials are set)
  console.log('\n🗄️  Checking Supabase connection...');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Try a simple query (will fail if no tables exist, but connection will work)
      const { error } = await supabase.from('_migrations').select('count').limit(1);

      // Check if error is due to missing table (expected) vs connection issue
      if (error) {
        const isTableMissing = error.message.includes('does not exist') ||
                               error.message.includes('relation') ||
                               error.message.includes('schema cache');

        if (isTableMissing) {
          console.log('   ✅ Supabase connection - SUCCESS');
          warnings.push('Supabase connected but no tables exist yet (normal for Task 1.1)');
        } else {
          throw error;
        }
      } else {
        console.log('   ✅ Supabase connection - SUCCESS');
      }
    } catch (error: any) {
      console.log(`   ❌ Supabase connection - FAILED: ${error.message}`);
      allValid = false;
    }
  } else {
    console.log('   ⏭️  Supabase credentials not set - SKIPPED');
    warnings.push('Supabase credentials not configured');
  }

  // Check Vapi client initialization
  console.log('\n🎙️  Checking Vapi.ai client...');
  try {
    const { VapiClient } = require('../lib/vapi/client');
    const vapiClient = new VapiClient();
    console.log('   ✅ Vapi client initialized');
    warnings.push('Full Vapi integration in Task 2.1');
  } catch (error: any) {
    console.log(`   ❌ Vapi client - FAILED: ${error.message}`);
    allValid = false;
  }

  // Check Twilio client initialization
  console.log('\n💬 Checking Twilio client...');
  try {
    const { TwilioClient } = require('../lib/twilio/client');
    const twilioClient = new TwilioClient();
    console.log('   ✅ Twilio client initialized');
    warnings.push('Full Twilio integration in Task 3.1');
  } catch (error: any) {
    console.log(`   ❌ Twilio client - FAILED: ${error.message}`);
    allValid = false;
  }

  // Check directory structure
  console.log('\n📁 Checking directory structure...');
  const fs = require('fs');
  const path = require('path');

  const requiredDirs = [
    'app',
    'lib/supabase',
    'lib/vapi',
    'lib/twilio',
    'components',
    'supabase/migrations',
    'scripts',
  ];

  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`   ✅ ${dir}/ - EXISTS`);
    } else {
      console.log(`   ❌ ${dir}/ - MISSING`);
      allValid = false;
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of warnings) {
      console.log(`   - ${warning}`);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ Development environment setup complete!');
    console.log('\n📝 Manual steps still required:');
    console.log('  1. Create Supabase account and project at https://supabase.com');
    console.log('  2. Create Vapi.ai account at https://vapi.ai');
    console.log('  3. Create Twilio account at https://twilio.com');
    console.log('  4. Update .env.local with your credentials');
    console.log('\n📚 Next steps:');
    console.log('  1. Complete manual setup steps above');
    console.log('  2. Run Task 1.2 to create database schema');
    console.log('  3. Run Task 1.3 to implement template engine');
    console.log('  4. Run Task 1.4 to define industry templates');
  } else {
    console.log('❌ Development environment setup incomplete');
    console.log('\nPlease fix the issues above and run validation again:');
    console.log('  npm run validate-setup');
  }
  console.log('='.repeat(50));

  process.exit(allValid ? 0 : 1);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run validation
validateSetup().catch((error) => {
  console.error('Validation script error:', error);
  process.exit(1);
});
