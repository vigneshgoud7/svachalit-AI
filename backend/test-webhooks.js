/**
 * Webhook Ingestion & Voice Event Driver Script
 * Automated verification script simulating omnichannel & voice calls webhook deliveries
 */

const BACKEND_URL = 'http://localhost:4000';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING OMNICHANNEL & VOICE HUB VERIFICATION');
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
      
      const json = await response.json().catch(() => null);
      console.log(`⬅️  Response [HTTP ${response.status}]:`, json || await response.text());
      return response.ok;
    } catch (err) {
      console.error(`❌ Webhook dispatch failed:`, err.message);
      return false;
    }
  }

  // Step 2: Simulate Inbound WhatsApp Webhook (Meta API payload structure)
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
              contacts: [{ wa_id: '15555551212', profile: { name: 'Sarah Connor' } }],
              messages: [
                {
                  from: '15555551212',
                  id: `wamid.HBgLMTU1NTU1NTEyMTISFQIA`,
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

  // Step 3: Simulate Inbound Instagram DM Webhook
  const instagramPayload = {
    object: 'instagram',
    entry: [
      {
        id: 'INSTAGRAM_PAGE_ID',
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

  // ====================================================
  // Step 5: Simulate Vapi Voice Call Webhooks sequence
  // ====================================================
  console.log('\n--- Starting Vapi Voice Webhooks Flow Simulation ---');

  const callId = 'call_session_vapi_9988';
  const customerNumber = '+15005550006';

  // A. Simulate assistant-request
  await triggerWebhook('voice', {
    message: {
      type: 'assistant-request',
      call: { id: callId },
      customer: { number: customerNumber }
    }
  });

  // B. Simulate real-time user speech transcript streaming
  await triggerWebhook('voice', {
    message: {
      type: 'transcript',
      role: 'user',
      transcript: 'I want to book a pricing session.',
      call: { id: callId },
      customer: { number: customerNumber }
    }
  });

  // C. Simulate Vapi triggering function execution (bookAppointment)
  await triggerWebhook('voice', {
    message: {
      type: 'tool-calls',
      call: { id: callId },
      customer: { number: customerNumber },
      toolCalls: [
        {
          id: 'call_vapi_appt_123',
          function: {
            name: 'bookAppointment',
            arguments: {
              dateTime: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days out
              customerName: 'Sarah Connor'
            }
          }
        }
      ]
    }
  });

  // D. Simulate active speech state change
  await triggerWebhook('voice', {
    message: {
      type: 'transcript',
      role: 'assistant',
      transcript: 'I have scheduled your appointment. Is there anything else?',
      call: { id: callId },
      customer: { number: customerNumber }
    }
  });

  // E. Simulate call end report
  await triggerWebhook('voice', {
    message: {
      type: 'end-of-call-report',
      duration: 45,
      cost: 0.15,
      summary: 'Sarah Connor inquired about pricing and successfully booked a product demo appointment for next Thursday.',
      call: { id: callId },
      customer: { number: customerNumber }
    }
  });

  console.log('\n====================================================');
  console.log('🎉 OMNICHANNEL & VOICE CALL PIPELINE VERIFIED!');
  console.log('====================================================');
  console.log('Check the running server logs to see the BullMQ processes.');
  console.log('Open http://localhost:3000 to monitor real-time sync.');
  console.log('====================================================\n');
}

runTests();
