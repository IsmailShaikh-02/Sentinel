import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toyScript = path.join(__dirname, "toyService.ts");

// Use the current Node executable and run tsx as a loader/module
// This avoids shell=True and .cmd resolution issues on Windows
const nodeExec = process.execPath;
const tsxLoader = "tsx"; 

const fleet = [
  { args: ["--port", "4001", "--name", "flaky-1", "--failure-rate", "0.5"] },
  { args: ["--port", "4002", "--name", "slowpoke", "--failure-rate", "0.1", "--max-delay", "4500"] },
  { args: ["--port", "4003", "--name", "mostly-ok", "--failure-rate", "0.05"] },
];

const children = fleet.map(({ args }) => {
  // Spawn: node -r tsx script.ts args...
  // Note: We rely on the local node_modules/.bin/tsx being in the PATH of the parent process
  // OR we can explicitly point to the binary if needed.
  
  // Safest cross-platform approach without 'shell':
  return spawn(nodeExec, ["--loader", "tsx", toyScript, ...args], {
    stdio: "inherit",
    shell: false, // Explicitly false to avoid shell injection warnings
  });
});

function killFleet(signal: NodeJS.Signals): void {
  for (const child of children) {
    child.kill(signal);
  }
  process.exit(0);
}

process.on("SIGINT", () => killFleet("SIGINT"));
process.on("SIGTERM", () => killFleet("SIGTERM"));

console.log(`[Fleet] Starting toy services using Node exec: ${nodeExec}`);