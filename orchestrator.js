import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICES = [
  { name: 'AUTH-SVC   ', port: 5001, script: 'services/auth-service/server.js', color: '\x1b[36m' },
  { name: 'RAILWAY-SVC', port: 5002, script: 'services/railway-service/server.js', color: '\x1b[32m' },
  { name: 'BOOKING-SVC', port: 5003, script: 'services/booking-service/server.js', color: '\x1b[33m' },
  { name: 'FOOD-SVC   ', port: 5004, script: 'services/food-service/server.js', color: '\x1b[35m' },
  { name: 'DEST-SVC   ', port: 5005, script: 'services/destination-service/server.js', color: '\x1b[34m' },
  { name: 'JOURNEY-SVC', port: 5006, script: 'services/journey-service/server.js', color: '\x1b[96m' },
  { name: 'VOICE-SVC  ', port: 5007, script: 'services/voice-ai-service/server.js', color: '\x1b[92m' },
  { name: 'API-GATEWAY', port: 5050, script: 'services/api-gateway/server.js', color: '\x1b[31m' }
];

const processes = [];

console.log('\x1b[1m\x1b[35m===============================================================\x1b[0m');
console.log('\x1b[1m\x1b[35m       RAILMATE MICROSERVICES ORCHESTRATOR STARTING            \x1b[0m');
console.log('\x1b[1m\x1b[35m===============================================================\x1b[0m\n');

for (const svc of SERVICES) {
  const fullPath = path.join(__dirname, svc.script);
  const proc = spawn('node', [fullPath], {
    env: { ...process.env, PORT: svc.port },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line) console.log(`${svc.color}[${svc.name}:${svc.port}]\x1b[0m ${line}`);
    }
  });

  proc.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line) console.error(`${svc.color}[${svc.name}:${svc.port} ERR]\x1b[0m ${line}`);
    }
  });

  proc.on('close', code => {
    console.log(`${svc.color}[${svc.name}:${svc.port}]\x1b[0m Exited with code ${code}`);
  });

  processes.push({ name: svc.name, proc });
}

// Cleanup on exit
function shutdown() {
  console.log('\n\x1b[33mGracefully shutting down all microservices...\x1b[0m');
  for (const { name, proc } of processes) {
    try {
      proc.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
