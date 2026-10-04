// Verification script for Route AI responses: Fastest train and timings enforcement
const GATEWAY = 'http://127.0.0.1:5050';

async function testRouteResponses() {
  console.log('Testing Route Queries for Fastest Train and Timings...\n');

  // Query 1: Ghaziabad to Bhagalpur (Hindi)
  const q1 = await fetch(`${GATEWAY}/api/voice-ai/process-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'गाजियाबाद से भागलपुर का ट्रेन रूट क्या है?', languageCode: 'hi-IN' })
  }).then(r => r.json());

  console.log('--- TEST 1: Ghaziabad to Bhagalpur (Hindi) ---');
  console.log('Intent:', q1.intent);
  console.log('Spoken Answer:\n', q1.spokenResponse);
  console.log('Route Details:', JSON.stringify(q1.routeDetails, null, 2));

  // Query 2: Delhi to Mumbai (English)
  const q2 = await fetch(`${GATEWAY}/api/voice-ai/process-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Delhi to Mumbai train route and fastest train', languageCode: 'en-IN' })
  }).then(r => r.json());

  console.log('\n--- TEST 2: Delhi to Mumbai (English) ---');
  console.log('Intent:', q2.intent);
  console.log('Spoken Answer:\n', q2.spokenResponse);
  console.log('Route Details:', JSON.stringify(q2.routeDetails, null, 2));

  // Query 3: Mumbai to Goa (Hindi)
  const q3 = await fetch(`${GATEWAY}/api/voice-ai/process-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'मुंबई से गोवा ट्रेन रूट', languageCode: 'hi-IN' })
  }).then(r => r.json());

  console.log('\n--- TEST 3: Mumbai to Goa (Hindi) ---');
  console.log('Spoken Answer:\n', q3.spokenResponse);
  console.log('Fastest Train:', q3.routeDetails.fastestTrain);

  // Query 4: Chat Assistant endpoint (English)
  const q4 = await fetch(`${GATEWAY}/api/voice-ai/chat-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Ghaziabad to Bhagalpur train route', languageCode: 'en-IN' })
  }).then(r => r.json());

  console.log('\n--- TEST 4: Chat Assistant endpoint ---');
  console.log('Model:', q4.model);
  console.log('Reply:\n', q4.reply);

  // Assertions
  const assert = (cond, msg) => {
    if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
    console.log('✓ PASS:', msg);
  };

  assert(q1.spokenResponse.includes('22406') || q1.spokenResponse.includes('12368'), 'Q1 mentions fastest train number');
  assert(q1.spokenResponse.includes('17:20') || q1.spokenResponse.includes('13:43'), 'Q1 mentions departure timing');
  assert(q1.routeDetails.fastestTrain != null, 'Q1 has fastestTrain object');
  assert(q1.routeDetails.timings != null, 'Q1 has timings field');

  assert(q2.spokenResponse.includes('12952'), 'Q2 mentions 12952 Tejas Rajdhani');
  assert(q2.spokenResponse.includes('16:55') && q2.spokenResponse.includes('08:35'), 'Q2 mentions departure & arrival timings');
  assert(q2.routeDetails.fastestTrain != null, 'Q2 has fastestTrain object');

  assert(q3.spokenResponse.includes('22229'), 'Q3 mentions 22229 Vande Bharat');
  assert(q3.spokenResponse.includes('05:25') && q3.spokenResponse.includes('13:10'), 'Q3 mentions timings');

  assert(q4.reply.includes('22406') || q4.reply.includes('12368'), 'Q4 reply has fastest train');

  console.log('\nALL FASTEST TRAIN & TIMINGS ASSERTIONS PASSED SUCCESSFULLY!');
}

testRouteResponses().catch(e => {
  console.error(e);
  process.exit(1);
});
