// Quick test script for RailMate microservices
const testUrls = [
  'http://127.0.0.1:5050/api/health',
  'http://127.0.0.1:5001/health',
  'http://127.0.0.1:5002/health',
  'http://127.0.0.1:5003/health',
  'http://127.0.0.1:5004/health',
  'http://127.0.0.1:5005/health',
  'http://127.0.0.1:5006/health',
  'http://127.0.0.1:5007/health'
];

async function runTests() {
  console.log('Testing microservices health endpoints...');
  for (const url of testUrls) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      console.log(`✅ [${res.status}] ${url} ->`, json.service || json.gateway);
    } catch (e) {
      console.error(`❌ FAILED ${url}:`, e.message);
    }
  }
}

runTests();
