// src/scripts/toy-fleet.ts
import http from 'http';

function createServer(port: number, handler: http.RequestListener) {
  const server = http.createServer(handler);
  server.listen(port, () => {
    console.log(`🤖 Toy service online: http://localhost:${port}`);
  });
  return server;
}

// 1. Service A (Port 4001): Always healthy
// createServer(4001, (_req, res) => {
//   res.writeHead(200, { 'Content-Type': 'application/json' });
//   res.end(JSON.stringify({ service: 'Service A', status: 'healthy' }));
// });

// 2. Service B (Port 4002): Flaky (40% chance of 500, 60% chance of 200)
createServer(4002, (_req, res) => {
  const isFailure = Math.random() < 0.4;

  if (isFailure) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ service: 'Service B', status: 'intermittent_failure', error: 'Database timeout' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ service: 'Service B', status: 'healthy' }));
  }
});

// 3. Service C (Port 4003): Latency simulator (delays between 500ms and 2500ms, then 200 OK)
createServer(4003, (_req, res) => {
  const delayMs = Math.floor(Math.random() * (2500 - 500 + 1)) + 500;

  setTimeout(() => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ service: 'Service C', status: 'healthy', simulated_latency_ms: delayMs }));
  }, delayMs);
});