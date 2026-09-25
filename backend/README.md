# Sentinel — Alerting & Monitoring System

Sentinel is an automated service monitoring, incident detection, alerting, and analytics platform.

## Brevo Setup Instructions

To enable email alert delivery via Brevo:

1. Create an account at [brevo.com](https://www.brevo.com/).
2. Navigate to **Settings** → **API Keys** → **Create a new API Key**.
3. Copy your API key.
4. Add the following to your `.env` file:
   ```env
   BREVO_API_KEY=your-brevo-api-key-here
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   BREVO_SENDER_NAME=Sentinel
   ```
5. Verify your sender email domain in Brevo settings.

## Getting Started

### Installation
```bash
npm install
```

### Database Migration
```bash
npm run migrate
```

### Running Locally
```bash
# Start API server
npm run dev

# Start background worker
npm run worker
```

### Testing & Type Checking
```bash
npm run typecheck
npm run test
```

## Features

- **Service Health Checks**: Scheduled automated checks via BullMQ + Redis.
- **Incident Analysis**: Automatic incident creation on consecutive failures and resolution on recovery.
- **Brevo Email Alerts**: Configurable channels with deduplication per incident per channel in `alerts_sent`.
- **Analytics & Metrics**: On-demand uptime percentage breakdown and latency percentiles (`P50`, `P95`, `P99`).
