Let's build this step by step. By the end you'll have a running, authenticated API connected to Neon that can register a service and record a real health check. Follow in order — each step depends on the previous.

---

## Step 0 — Prerequisites

Check you have these (install Node LTS ≥ 20 from nodejs.org if missing):

```bash
node -v
git --version
```

Create your accounts (free):
- **Neon** → neon.tech → create a project named `sentinel` → copy the connection string (looks like `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require`)
- **GitHub** → create empty repo `sentinel`

---

## Step 1 — Scaffold the project

```bash
mkdir sentinel && cd sentinel
git init
npm init -y
npm install express zod pg jsonwebtoken bcrypt dotenv pino
npm install -D typescript tsx @types/node @types/express @types/pg @types/jsonwebtoken @types/bcrypt vitest supertest @types/supertest
npx tsc --init
```

Create the folder structure:

```bash
mkdir -p src/{routes,controllers,services,middleware,db,utils}
touch .env .env.example .gitignore
```

Put this in `.gitignore`:

```
node_modules
dist
.env
```

---

## Step 2 — Configure TypeScript

Replace `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

In `package.json`, replace the `"scripts"` section:

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

---

## Step 3 — Environment config

Fill `.env` (your real secrets — never committed):

```
DATABASE_URL=postgresql://...your-neon-string...
JWT_SECRET=pick-a-long-random-string-here
PORT=3000
```

And `.env.example` (committed, no real values):

```
DATABASE_URL=
JWT_SECRET=
PORT=3000
```

Create `src/env.ts` — validated config with Zod, so the app refuses to boot with bad config:

```ts
import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
```

---

## Step 4 — Database layer

Create `src/db/pool.ts`:

```ts
import { Pool } from "pg";
import { env } from "../env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
});

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
  process.exit(1);
});
```

Now create the initial migration. Make a folder `src/db/migrations/001_init.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  url                TEXT NOT NULL,
  method             TEXT NOT NULL DEFAULT 'GET',
  expected_status    INT  NOT NULL DEFAULT 200,
  check_interval_sec INT  NOT NULL DEFAULT 60,
  enabled            BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checks (
  id               BIGSERIAL PRIMARY KEY,
  service_id       UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status_code      INT,
  response_time_ms INT,
  ok               BOOLEAN NOT NULL,
  checked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checks_service_time
  ON checks (service_id, checked_at DESC);
```

Run it against Neon. Install `psql` (or use Neon's web SQL editor) and execute:

```bash
psql "$DATABASE_URL" -f src/db/migrations/001_init.sql
```

---

## Step 5 — Validation schemas & error types

Create `src/utils/errors.ts` — typed errors the global handler understands:

```ts
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const NotFoundError = (msg = "Not found") => new HttpError(404, msg);
export const UnauthorizedError = (msg = "Unauthorized") => new HttpError(401, msg);
export const ConflictError = (msg: string) => new HttpError(409, msg);
```

Create `src/utils/schemas.ts`:

```ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = registerSchema;

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  method: z.enum(["GET", "HEAD"]).default("GET"),
  expected_status: z.number().int().min(100).max(599).default(200),
  check_interval_sec: z.number().int().min(10).max(3600).default(60),
});
```

---

## Step 6 — Auth (register / login / middleware)

Create `src/controllers/auth.controller.ts`:

```ts
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { env } from "../env.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import type { registerSchema, loginSchema } from "../utils/schemas.js";
import type { z } from "zod";

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as RegisterBody;
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === "23505") return next(new ConflictError("Email already registered"));
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginBody;
    const { rows } = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = $1", [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw UnauthorizedError("Invalid credentials");
    }
    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: "15m" });
    res.json({ access_token: token, token_type: "Bearer" });
  } catch (err) {
    next(err);
  }
}
```

Create `src/middleware/auth.ts`:

```ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { UnauthorizedError } from "../utils/errors.js";

// Extend Express Request so controllers get typed user id
declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(UnauthorizedError());
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET);
    req.userId = payload.sub as string;
    next();
  } catch {
    next(UnauthorizedError("Invalid or expired token"));
  }
};
```

---

## Step 7 — Services CRUD + the manual check (the heart of Phase 1)

Create `src/controllers/services.controller.ts`:

```ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { NotFoundError } from "../utils/errors.js";
import { createServiceSchema } from "../utils/schemas.js";

export async function createService(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createServiceSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO services (user_id, name, url, method, expected_status, check_interval_sec)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, data.name, data.url, data.method, data.expected_status, data.check_interval_sec]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function listServices(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, c.ok AS last_ok, c.checked_at AS last_checked, c.response_time_ms
       FROM services s
       LEFT JOIN LATERAL (
         SELECT ok, checked_at, response_time_ms FROM checks
         WHERE service_id = s.id ORDER BY checked_at DESC LIMIT 1
       ) c ON true
       WHERE s.user_id = $1 AND s.enabled = true
       ORDER BY s.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getService(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM services WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (!rows[0]) throw NotFoundError("Service not found");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}
```

Create `src/services/check.service.ts` — performs an actual HTTP check and records it:

```ts
import { pool } from "../db/pool.js";
import { NotFoundError } from "../utils/errors.js";

export async function runManualCheck(serviceId: string, userId: string) {
  const { rows } = await pool.query(
    "SELECT * FROM services WHERE id = $1 AND user_id = $2",
    [serviceId, userId]
  );
  const svc = rows[0];
  if (!svc) throw NotFoundError("Service not found");

  const startedAt = Date.now();
  let statusCode: number | null = null;
  let ok = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(svc.url, {
      method: svc.method,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    statusCode = response.status;
    ok = response.status === svc.expected_status;
  } catch {
    ok = false; // network error / timeout / DNS failure
  }
  const responseTimeMs = Date.now() - startedAt;

  const insert = await pool.query(
    `INSERT INTO checks (service_id, status_code, response_time_ms, ok)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [serviceId, statusCode, responseTimeMs, ok]
  );
  return { check: insert.rows[0], ok, responseTimeMs, statusCode };
}
```

---

## Step 8 — Routes + global error handler + app entry

Create `src/routes/index.ts`:

```ts
import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import {
  createService, listServices, getService,
} from "../controllers/services.controller.js";
import { runManualCheck } from "../services/check.service.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, createServiceSchema } from "../utils/schemas.js";

const router = Router();

router.post("/auth/register", validate(registerSchema), register);
router.post("/auth/login", validate(loginSchema), login);

router.use(requireAuth); // everything below needs a token

router.post("/services", validate(createServiceSchema), createService);
router.get("/services", listServices);
router.get("/services/:id", getService);
router.post("/services/:id/check", runManualCheckRoute);

async function runManualCheckRoute(req: any, res: any, next: any) {
  try {
    const result = await runManualCheck(req.params.id, req.userId);
    res.json(result);
  } catch (err) { next(err); }
}

export default router;
```

Create `src/middleware/validate.ts`:

```ts
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validate = (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
```

Create `src/app.ts`:

```ts
import express from "express";
import pino from "pino";
import router from "./routes/index.js";

export const logger = pino();
export const app = express();

app.use(express.json());
app.use(logger);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", router);

// global error handler — MUST have 4 args
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.name === "ZodError") {
    return res.status(422).json({
      error: "Validation failed",
      details: err.issues.map((i: any) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const status = err?.status ?? 500;
  if (status >= 500) logger.error(err);
  res.status(status).json({ error: err?.message ?? "Internal server error" });
});
```

Create `src/index.ts`:

```ts
import { app, logger } from "./app.js";
import { env } from "./env.js";
import { pool } from "./db/pool.js";

app.listen(env.PORT, () => logger.info(`Sentinel listening on :${env.PORT}`));

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
```

---

## Step 9 — Run and verify

```bash
npm run typecheck   # fix any type errors first
npm run dev
```

Now test the whole loop with curl (keep the server running in another terminal):

```bash
# 1. register
curl -X POST localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","password":"supersecret1"}'

# 2. login → copy the access_token from the response
curl -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","password":"supersecret1"}'

TOKEN="paste-token-here"

# 3. register a target — GitHub's API as your first monitored service
curl -X POST localhost:3000/api/services \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"GitHub API","url":"https://api.github.com","check_interval_sec":60}'

# 4. run a manual check — this hits GitHub for real and records the result
curl -X POST localhost:3000/api/services/<service-id-from-step-3>/check \
  -H "Authorization: Bearer $TOKEN"

# 5. list services with their latest status
curl localhost:3000/api/services -H "Authorization: Bearer $TOKEN"
```

**Verification moment:** open Neon's query editor and run `SELECT * FROM checks;` — you should see your first recorded health check with a real response time. Your project is alive.

---

## Step 10 — Commit

```bash
git add -A
git commit -m "Phase 1: auth, services CRUD, manual health checks"
git remote add origin https://github.com/<you>/sentinel.git
git push -u origin main
```

---

## Where you are now vs. what's next

✅ Working: TS setup, Zod validation at the boundary, JWT auth, ownership-scoped queries (`WHERE user_id = $1` — notice every query filters by owner: that's authorization done right), typed errors, global error handler, real checks recorded in Postgres.

Next sessions build on this exact code:
1. **Step 11 (later):** Redis + BullMQ — replace the manual check endpoint with a repeatable-job worker that calls `runManualCheck` automatically per interval (the function is already shaped perfectly for reuse)
2. **Step 12:** incident engine with hysteresis on top of the `checks` rows
3. **Step 13:** Telegram alerting

Report back when step 9 works (or paste any error you hit), and we'll move to the worker phase.