import 'dotenv/config'; // Load environment variables
import { createServerVapiService } from '@/lib/vapi/multilingual-vapi-service';

async function createAssistant() {
  console.log('Starting assistant creation script...');

  const organizationId = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2';
  const industryCode = 'hvac';
  const language = 'en';

  const businessData = {
    business_name: 'Test HVAC Company',
    business_phone: '+18453286373',
    business_address: '123 Main St',
    business_email: 'test@test.com',
    primary_language: language,
    supported_languages: [language],
    timezone: 'America/New_York',
    emergency_contact_phone: '',
    emergency_contact_email: '',
    sms_enabled: true
  };

  try {
    const vapiService = createServerVapiService();
    console.log(`Creating assistant for org: ${organizationId} in industry: ${industryCode}`);
    
    const assistant = await vapiService.createMultilingualAssistant(
      organizationId,
      industryCode,
      businessData,
      language
    );

    console.log('\n✅ Assistant created successfully!');
    console.log(JSON.stringify(assistant, null, 2));

  } catch (error) {
    console.error('\n❌ Error creating assistant:', error);
    process.exit(1);
  }
}

createAssistant();