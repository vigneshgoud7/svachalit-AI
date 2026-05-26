/**
 * Webhook Ingestion Driver Script
 * Automated verification script simulating omnichannel webhook deliveries
 */

const BACKEND_URL = 'http://localhost:4000';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING OMNICHANNEL HUB PIPELINE VERIFICATION');
  console.log('====================================================');

  // Step 1: Seed the dev database to create Tenant Acme Corp & retrieve active API credentials
  console.log('\n[Step 1] Seeding database environment...');
  let tenantApiKey = '';
  try {
    const seedRes = await fetch(`${BACKEND_URL}/api/v1/dev/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!seedRes.ok) {
      throw new Error(`Seed failed with HTTP ${seedRes.status}`);
    }

    const seedData = await seedRes.json();
    tenantApiKey = seedData.tenantApiKey;
    console.log(`✅ Database successfully configured. Tenant API Key: ${tenantApiKey}`);
  } catch (err) {
    console.error('❌ Database seeding failed. Make sure the backend server is running on http://localhost:4000.');
    console.error(err);
    process.exit(1);
  }

  // Helper to send post webhook requests
  async function triggerWebhook(endpoint, payload) {
    console.log(`\n➡️  Triggering Webhook: ${endpoint}`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/webhooks/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-api-key': tenantApiKey
        },
        body: JSON.stringify(payload)
      });
      
      const text = await response.text();
      console.log(`⬅️  Response [HTTP ${response.status}]:`, text);
      return response.ok;
    } catch (err) {
      console.error(`❌ Webhook dispatch failed:`, err.message);
      return false;
    }
  }

  // Step 2: Simulate Inbound WhatsApp Webhook (Meta API payload structure)
  // Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
  const whatsappPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '16505551111',
                phone_number_id: '123456789'
              },
              contacts: [
                {
                  profile: { name: 'Sarah Connor' },
                  wa_id: '15555551212'
                }
              ],
              messages: [
                {
                  from: '15555551212',
                  id: `wamid.HBgLMTU1NTU1NTEyMTISFQIAEhgWM0VDQzNBRDY1N0VFMDM0N0JDRDYyOAA=`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: 'What are your product pricing rates?' },
                  type: 'text'
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  await triggerWebhook('whatsapp', whatsappPayload);

  // Step 3: Simulate Inbound Instagram DM Webhook (Instagram Graph API format)
  // Ref: https://developers.facebook.com/docs/instagram-api/guides/messaging/
  const instagramPayload = {
    object: 'instagram',
    entry: [
      {
        id: 'INSTAGRAM_PAGE_ID',
        time: Date.now(),
        messaging: [
          {
            sender: { id: 'ig_user_id_445' },
            recipient: { id: 'ig_page_id_778' },
            timestamp: Date.now(),
            message: {
              mid: 'ig_mid_99881122',
              text: 'Can I book an appointment for tomorrow?'
            }
          }
        ]
      }
    ]
  };

  await triggerWebhook('instagram', instagramPayload);

  // Step 4: Simulate Facebook Messenger Inbound Message Webhook
  const messengerPayload = {
    object: 'page',
    entry: [
      {
        id: 'FB_PAGE_ID',
        time: Date.now(),
        messaging: [
          {
            sender: { id: 'fb_psid_3300' },
            recipient: { id: 'fb_page_id_8800' },
            timestamp: Date.now(),
            message: {
              mid: 'm_mid_88992211',
              text: 'Please transfer me to a human representative.'
            }
          }
        ]
      }
    ]
  };

  await triggerWebhook('facebook', messengerPayload);

  // Step 5: Simulate Voice Stream Webhook (Twilio transcription schema)
  const twilioVoicePayload = {
    CallSid: 'CAaaabbbbccccddddeeeeffff00001111',
    AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    From: '+15005550006',
    To: '+15005550001',
    CallStatus: 'in-progress',
    SpeechResult: 'I want to schedule a pricing session under the name John Wick.',
    Confidence: '0.98'
  };

  await triggerWebhook('voice', twilioVoicePayload);

  console.log('\n====================================================');
  console.log('🎉 PIPELINE DESPATCH AND VERIFICATION TESTS SUBMITTED!');
  console.log('====================================================');
  console.log('Check the running server logs to see the BullMQ jobs');
  console.log('process the message queue and run AI Orchestration.');
  console.log('Check the frontend UI dashboard on http://localhost:3000');
  console.log('to monitor conversation threads and state in real-time!');
  console.log('====================================================\n');
}

runTests();
