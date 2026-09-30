# Sentinel

<p align="center">
  <img src="https://raw.githubusercontent.com/IsmailShaikh-02/Sentinel/main/frontend/public/sentinel-logo.svg" alt="Sentinel Logo" width="100" height="100" onerror="this.style.display='none'">
</p>

<p align="center">
  <strong>High-Availability Uptime Monitoring and Heartbeat Infrastructure</strong>
</p>

<p align="center">
  <a href="https://github.com/IsmailShaikh-02/Sentinel/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=githubactions" alt="Build Status"></a>
  <a href="https://github.com/IsmailShaikh-02/Sentinel/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square" alt="License"></a>
  <a href="https://typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"></a>
  <a href="https://postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
  <a href="https://redis.io"><img src="https://img.shields.io/badge/Redis-7.0+-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis"></a>
  <a href="https://sentinel-seven-olive.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-Active-00C7B7?style=flat-square&logo=vercel&logoColor=white" alt="Live Demo"></a>
</p>

---

## Executive Summary

Sentinel is an open-source, distributed uptime monitoring and dead man's switch tracking platform. Designed for production environments, Sentinel continuously evaluates endpoint health, response latencies, and scheduled background job executions to deliver real-time alerting and incident tracking before operational degradation impacts end users.

### Operational Analogy
> **System Health Monitoring as Infrastructure Telemetry**: Sentinel operates analogously to an industrial monitoring system for web applications and asynchronous data pipelines. It continuously polls endpoint health, validates HTTP contracts, listens for expected cron heartbeats, and dispatches automated alerts across notification channels the moment a variance is detected.

### Navigation Links
[Live Dashboard Demo](https://sentinel-seven-olive.vercel.app) | [API Health Endpoint](https://sentinel-seven-olive.vercel.app/health) | [Quick Start Guide](#quick-start)

---

## System Visuals & Demonstration

*(Interface previews and telemetry assets. Placeholders below will be updated with live recordings).*

| Service Health & Latency Dashboard | Incident Timeline & Escalation Logs |
| :---: | :---: |
| ![Sentinel Health Dashboard](https://raw.githubusercontent.com/IsmailShaikh-02/Sentinel/main/frontend/public/screenshots/dashboard.png) | ![Sentinel Service Logs](https://raw.githubusercontent.com/IsmailShaikh-02/Sentinel/main/frontend/public/screenshots/services.png) |
| *Real-time latency percentiles, uptime percentages, and status checks.* | *Automated incident state transitions, escalation timelines, and MTTR metrics.* |

| Status Page | Email Alert Service |
| :---: | :---: |
| ![Sentinel Status Page](https://raw.githubusercontent.com/IsmailShaikh-02/Sentinel/main/frontend/public/screenshots/status.png) | ![Sentinel Email Alert](https://raw.githubusercontent.com/IsmailShaikh-02/Sentinel/main/frontend/public/screenshots/email.png) |
| *Real-time status of services.* | *Email notifications for incidents.* |

---

## Problem Statement

Modern cloud architectures rely on complex webs of microservices, third-party APIs, and scheduled background jobs. Traditional monitoring approaches introduce critical operational friction:

1. **Silent Asynchronous Failures**: Background worker jobs (ETL pipelines, database backups, recurring billing tasks) often crash or hang without returning standard HTTP status codes.
2. **Alert Noise & False Positives**: Transient network blips frequently trigger spurious alarms, leading to alert fatigue for on-call engineers.
3. **High SaaS Overhead**: Third-party uptime monitoring solutions enforce costly pricing tiers based on check frequency and notification volume.
4. **Disconnected Incident Workflow**: Manual coordination between detection systems, notification routing, MTTR tracking, and external status communication.

### Sentinel Resolution

- **Synthetic HTTP Probes**: Configurable HTTP/HTTPS health checks featuring timeout enforcement and payload response validation.
- **Dead Man's Switch (Heartbeat Tracking)**: Passive monitoring endpoint for external jobs. If a scheduled check-in window expires without a ping, Sentinel automatically initiates an incident.
- **Queue-Based Execution Engine**: Offloaded execution pipeline powered by Redis and BullMQ, isolating probe overhead from API handling.
- **Multi-Channel Alert Dispatcher**: Immediate notifications routed via Brevo Email, Discord Webhooks, and generic REST Webhooks.
- **Full Data Ownership**: Fully self-hostable infrastructure built on Node.js, PostgreSQL, and Redis.

---

## Features Matrix

| Feature Module | Description & Capability | Tech Stack / Architecture | Operational Value |
| :--- | :--- | :--- | :--- |
| **Synthetic Probes** | Automated HTTP/HTTPS probes running at defined intervals (10s to 1h). | Express, Fetch API, AbortController | Early detection of API degradation and service outages. |
| **Cron Heartbeats** | Dead man's switch tracking for cron jobs and background workers. | Unique Ping Keys, Redis Watchdog | Prevents silent failures in scheduled backend tasks. |
| **BullMQ Scheduler** | Distributed job queue handling high-concurrency probe scheduling. | BullMQ, Redis, Worker Threads | Eliminates thread blocking and ensures timing precision. |
| **Incident Engine** | State machine handling `TRIGGERED`, `ACKNOWLEDGED`, and `RESOLVED` states. | PostgreSQL, Transactional Locks | Prevents notification loops and computes accurate MTTR. |
| **Alert Dispatcher** | Asynchronous notification routing to Email, Discord, and Webhooks. | Brevo API, Discord Webhooks | Delivers immediate alerts to designated on-call channels. |
| **Analytics Engine** | Historical latency tracking, uptime percentages, and response distributions. | Recharts, PostgreSQL Aggregations | Provides analytical insight into service reliability trends. |
| **Public Status Pages** | Lightweight status pages for customer transparency during outages. | React, TanStack Query, TailwindCSS | Reduces inbound support volume during operational incidents. |
| **Security & Auth** | JWT-based authentication, bcrypt password hashing, and rate limiting. | `express-rate-limit`, JWT, CORS | Protects endpoints against unauthorized access and abuse. |

---

## Quick Start

### Prerequisites

Ensure the following dependencies are installed:
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **PostgreSQL**: `>= 15.0` (or Neon PostgreSQL instance)
- **Redis**: `>= 7.0` (or Upstash Redis instance)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/IsmailShaikh-02/Sentinel.git
cd Sentinel
```

---

### Step 2: Configure Environment Variables

#### Backend Environment (`backend/.env`)
Copy the sample environment file:
```bash
cp backend/.env.example backend/.env
```

Configure `backend/.env` with your database and service credentials:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sentinel_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_jwt_key_at_least_16_chars_long
BCRYPT_COST=12

# Brevo Email Service (Optional for email notifications)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=alerts@yourdomain.com
BREVO_SENDER_NAME=Sentinel Alerts
```

#### Frontend Environment (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
```

---

### Step 3: Install Dependencies & Run Database Migrations

#### Backend Installation
```bash
cd backend
npm install
npm run migrate
```

#### Frontend Installation
```bash
cd ../frontend
npm install
```

---

### Step 4: Launch Development Servers

Start the API server, worker process, and frontend dashboard in separate terminal sessions:

#### Terminal 1: API Server
```bash
cd backend
npm run dev
```

#### Terminal 2: BullMQ Queue Worker
```bash
cd backend
npm run worker
```

#### Terminal 3: Frontend Interface
```bash
cd frontend
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

---

## System Architecture

Sentinel employs a decoupled, event-driven architecture to separate core client API processing from asynchronous health check execution.

```mermaid
flowchart TB
    subgraph Clients["Client Tier"]
        UI["React Dashboard (Vite)"]
        PublicStatus["Public Status Page"]
        ExternalCron["External Background Job / Cron"]
    end

    subgraph API_Tier["API Tier (Express.js)"]
        Router["Express Router & Middlewares"]
        RateLimiter["Rate Limiter & JWT Security"]
        Controllers["Service, Incident & Alert Controllers"]
    end

    subgraph Storage["Storage Tier"]
        Postgres[(PostgreSQL Database)]
        Redis[(Redis Store)]
    end

    subgraph Worker_Tier["Asynchronous Execution Worker Tier"]
        BullMQ["BullMQ Scheduler & Job Queue"]
        Engine["Synthetic Monitoring Engine"]
        Watchdog["Heartbeat Dead Man's Switch Watchdog"]
        AlertDispatcher["Alerting Dispatch Engine"]
    end

    subgraph Targets["External Targets & Channels"]
        MonitoredAPIs["Monitored HTTP Services"]
        Discord["Discord Webhooks"]
        Email["Brevo Email Service"]
    end

    UI -->|REST API| Router
    PublicStatus -->|Read-only Status| Router
    ExternalCron -->|POST /api/ping/:key| Router

    Router --> RateLimiter
    RateLimiter --> Controllers
    Controllers --> Postgres
    Controllers --> Redis

    BullMQ <-->|Queue Jobs| Redis
    Engine -->|Poll Schedules| BullMQ
    Engine -->|Execute Probes| MonitoredAPIs
    Engine -->|Store Check Results| Postgres
    Engine -->|Trigger Alerts| AlertDispatcher

    Watchdog -->|Scan Missed Heartbeats| Postgres
    Watchdog -->|Initiate Incident| AlertDispatcher

    AlertDispatcher -->|Dispatch Notification| Discord
    AlertDispatcher -->|Dispatch Email| Email
```

---

## Usage Examples

### 1. Registering a Synthetic HTTP Monitor via REST API
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "name": "Payment Gateway API",
    "url": "https://api.stripe.com/v1/health",
    "intervalSeconds": 30,
    "timeoutMs": 5000,
    "expectedStatusCode": 200
  }'
```

---

### 2. Dispatching a Heartbeat Ping from a Cron Job

#### Shell / Curl
```bash
#!/bin/bash
# Execute nightly database dump
pg_dump -U postgres mydb > backup.sql

# On successful completion, signal Sentinel heartbeat endpoint
if [ $? -eq 0 ]; then
  curl -X POST https://your-sentinel-instance.com/api/ping/hb_live_9a8b7c6d5e
fi
```

#### Node.js / TypeScript Integration
```typescript
import fetch from 'node-fetch';

async function executeScheduledTask() {
  try {
    await processNightlyBatch();

    // Signal Sentinel that job completed on schedule
    await fetch('http://localhost:3000/api/ping/hb_live_9a8b7c6d5e', {
      method: 'POST'
    });
    console.log('Task completed and heartbeat dispatched.');
  } catch (error) {
    console.error('Task execution failed:', error);
    // Sentinel triggers an incident automatically upon heartbeat timeout
  }
}
```

---

### 3. Running Heartbeat Simulation Suite
Sentinel includes a demonstration script to evaluate heartbeat timeout detection and automatic incident resolution:
```bash
cd backend
npm run demo
```

---

## Contributing

Contributions are welcomed. Please follow these guidelines when submitting patches or extensions to Sentinel.

### Development Workflow

1. Fork the repository on GitHub.
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Implement changes ensuring full adherence to existing architectural patterns.

### Code Quality Verification

Run type checking and linting suites prior to submitting a pull request:

```bash
# Verify backend TypeScript compilation
cd backend
npm run typecheck

# Verify frontend TypeScript compilation and lint rules
cd ../frontend
npm run build
npm run lint
```

### Development Scripts Reference

| Directory | Command | Description |
| :--- | :--- | :--- |
| `backend/` | `npm run dev` | Runs backend Express server via `tsx watch`. |
| `backend/` | `npm run worker` | Runs background BullMQ worker daemon via `tsx watch`. |
| `backend/` | `npm run migrate` | Executes PostgreSQL database migrations. |
| `backend/` | `npm run demo` | Runs the heartbeat anomaly and recovery simulation script. |
| `frontend/` | `npm run dev` | Launches the Vite React frontend server. |
| `frontend/` | `npm run lint` | Runs `oxlint` static code analysis. |

---

## License

Distributed under the **ISC License**. See [`LICENSE`](file:///i:/Programming/Web%20dev/sentinel/LICENSE) for details.
