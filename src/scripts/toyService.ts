import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export interface ToyOptions {
  port: number;
  /** probability of returning 500 */
  failureRate?: number;
  /** ms of artificial delay */
  maxDelayMs?: number;
  name?: string;
}

export function startToyService({ port, failureRate = 0.3, maxDelayMs = 1500, name = "toy" }: ToyOptions): void {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const delay = Math.floor(Math.random() * maxDelayMs);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    const fail = Math.random() < failureRate;
    res.statusCode = fail ? 500 : 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ service: name, ok: !fail, delay }));
  });
  server.listen(port, () => console.log(`[${name}] listening on :${port} (failureRate=${failureRate})`));
}
// CLI entry: parse args like --port 4001 --name flaky-1 --failure-rate 0.5
if (process.argv.length > 2) {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  startToyService({
    port: Number(get("--port") ?? 4000),
    name: get("--name") ?? "toy",
    failureRate: Number(get("--failure-rate") ?? 0.3),
    maxDelayMs: Number(get("--max-delay") ?? 1500),
  });
}