// src/scripts/external-worker.ts

/**
 * Pure External Cron/Worker Simulator
 * 
 * Rules:
 * - NO database connection.
 * - NO imports from internal app modules.
 * - Communicates strictly via public HTTP POST /api/ping/:key
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const HEARTBEAT_KEY = process.env.HEARTBEAT_KEY || process.argv[2];

if (!HEARTBEAT_KEY) {
  console.error('❌ Error: Heartbeat key is required.');
  console.error('Usage: tsx src/scripts/external-worker.ts <HEARTBEAT_KEY>');
  process.exit(1);
}

const PING_URL = `${API_BASE}/api/ping/${HEARTBEAT_KEY}`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendPing(cycleNumber: number): Promise<boolean> {
  const timestamp = new Date().toLocaleTimeString();
  try {
    const res = await fetch(PING_URL, { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      console.log(`[${timestamp}] ✅ Cycle #${cycleNumber}: Ping ACK from Sentinel ->`, data);
      return true;
    } else {
      console.warn(`[${timestamp}] ⚠️ Cycle #${cycleNumber}: Ping rejected (${res.status}) ->`, data);
      return false;
    }
  } catch (err: any) {
    console.error(`[${timestamp}] ❌ Cycle #${cycleNumber}: Network error contacting Sentinel:`, err.message);
    return false;
  }
}

async function runExternalProcess() {
  console.log('🚀 External Worker Client Started');
  console.log(`📡 Target Endpoint: ${PING_URL}\n`);

  let cycle = 1;

  // ---------------------------------------------------------------------------
  // STAGE 1: Normal Nominal Operation (5 on-time pings, every 5s)
  // ---------------------------------------------------------------------------
  console.log('=== STAGE 1: Healthy Background Job Execution ===');
  for (let i = 0; i < 5; i++) {
    console.log(`⚙️  Worker running scheduled backup batch...`);
    await sleep(1000); // 1s task work
    await sendPing(cycle++);
    await sleep(9000); // Wait until next interval (5s total cadence)
  }

  // ---------------------------------------------------------------------------
  // STAGE 2: Simulated Flaky Network / Delayed Execution (Long lag)
  // ---------------------------------------------------------------------------
  console.log('\n=== STAGE 2: Anomaly - Heavy Database Lock / Network Lag ===');
  console.log('⏳ Worker job is hanging or delayed (Waiting 25 seconds)...');
  await sleep(40000); 
  console.log('⚠️ Worker finally finished late, sending delayed ping:');
  await sendPing(cycle++);

  // ---------------------------------------------------------------------------
  // STAGE 3: Total Crash (Dead Man's Switch Trigger)
  // ---------------------------------------------------------------------------
  console.log('\n=== STAGE 3: Anomaly - Hard Crash (Process Killed) ===');
  console.log('🛑 Simulating unhandled exception / crash. Worker goes completely SILENT.');
  console.log('👀 Check your Sentinel Worker console. Watch the watchdog detect the missing ping');
  console.log('   and trigger an OPEN incident after consecutive timeouts.\n');
  
  // Waiting 45 seconds to guarantee watchdog sweeps catch the silence
  for (let remaining = 45; remaining > 0; remaining -= 5) {
    console.log(`   [Crash silence] ${remaining}s remaining...`);
    await sleep(9000);
  }

  // ---------------------------------------------------------------------------
  // STAGE 4: Recovery (Service Restarts and Pings Again)
  // ---------------------------------------------------------------------------
  console.log('\n=== STAGE 4: Process Restarted / System Recovered ===');
  console.log('🔄 Worker daemon rebooted. Resuming steady 5-second health reports...');
  for (let i = 0; i < 4; i++) {
    await sendPing(cycle++);
    await sleep(5000);
  }

  console.log('\n🎉 Simulation cycle finished. The Incident Engine should now show RESOLVED.');
}

runExternalProcess();