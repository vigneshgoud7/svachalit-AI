# Multi-Channel Auto Reply & Business Automation Platform

This is a production-ready, modular "Hub-and-Spoke" multi-channel message router, AI Orchestration, and Business Automation Platform. 

It handles inbound communication streams from Meta Cloud APIs (WhatsApp, Instagram DM, Facebook Messenger) and Voice Streams (Twilio / Vapi), standardizes them into a single format, processes them asynchronously using a Redis-backed BullMQ queue, retrieves context from a pgvector-based Knowledge Base, runs custom OpenAI tool call pipelines, and routes responses back out.

It includes a real-time reactive agent dashboard built in Next.js (App Router) with Server-Sent Events (SSE) synchronization, allowing manual override, lead data capture, and live-chat customer handoff.

---

## Technical Stack & Architecture

### Backend (`/backend`)
- **Runtime & Server**: Node.js, TypeScript, Express.js.
- **ORM & Database**: Prisma ORM, PostgreSQL (supporting `pgvector` for RAG).
- **Background Processing Queue**: Redis, BullMQ for handling high-throughput webhooks, rate-limits, and retries.
- **AI Framework**: OpenAI SDK (Function calling + structured outputs).

### Frontend (`/frontend`)
- **Framework**: Next.js (App Router) + TypeScript.
- **Styles & Layout**: Tailwind CSS + Shadcn UI style tokens.
- **Real-Time updates**: Server-Sent Events (SSE) listener mapping chat thread state in real time.

---

## Directory Structure

```
multichannel-automation/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma             # PostgreSQL Database Schema
│   ├── src/
│   │   ├── config/env.ts             # Type-safe Environment loaders
│   │   ├── db/client.ts              # Database Client adapter
│   │   ├── queues/
│   │   │   ├── messageQueue.ts       # BullMQ Job Queue definition
│   │   │   └── messageWorker.ts      # Queue message processors
│   │   ├── routes/
│   │   │   └── webhookRoutes.ts      # Omnichannel Inbound Webhooks (WhatsApp, Messenger, IG, Voice)
│   │   ├── services/
│   │   │   ├── aiOrchestrator.ts     # Core Orchestration "Brain" (History retrieval, RAG, OpenAI pipeline)
│   │   │   ├── ragService.ts         # Vector generation and similarity search (pgvector)
│   │   │   ├── toolService.ts        # OpenAI tool calls (bookAppointment, exportToSheet, transferToHuman)
│   │   │   └── outboundRouter.ts     # Outbound adapters back to Meta/Twilio
│   │   └── index.ts                  # Backend Server entry point, SSE streams & Agent APIs
│   ├── package.json
│   ├── tsconfig.json
│   └── test-webhooks.js              # automated pipeline test runner script
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # Unified Live-Agent chat thread inbox and CRM dashboard
    │   │   ├── layout.tsx
    │   │   └── globals.css           # Tailwind bases, CSS dark-theme variables, and glassmorphism styling
    │   └── lib/utils.ts
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## Setup & Ingress Instructions

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (pgvector extension recommended, fallback supported)
- **Redis** server (running for BullMQ)
- **OpenAI API Key** (optional for mock testing, required for real LLM operations)

### 2. Backend Configurations
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update environment configurations in `.env`:
   ```ini
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/multichannel_db?schema=public"
   REDIS_URL="redis://localhost:6379"
   OPENAI_API_KEY="your-openai-key"
   ```
4. Run migrations and generate Prisma schemas:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Launch the backend server & worker in development mode:
   ```bash
   npm run dev
   ```
   *The server starts listening on `http://localhost:4000`.*

### 3. Frontend Dashboard Configurations
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development Next.js dev server:
   ```bash
   npm run dev
   ```
   *The client dashboard starts at `http://localhost:3000`.*

---

## Automated Webhook Testing

We have built a developer mock-seeding utility and webhook generator script. To verify the entire pipeline end-to-end:

1. Keep your backend server running (`npm run dev` in `backend/`).
2. Run the test script from the `backend/` directory:
   ```bash
   node test-webhooks.js
   ```

### What this script executes:
1. Hits the `/api/v1/dev/seed` REST endpoint to provision a test tenant ("Acme Corp"), active knowledge base chunks (prices, policies, support hours), and a sample customer thread.
2. Captures the generated `tenantApiKey`.
3. Posts mock inbound webhook payloads representing:
   - **WhatsApp text inquiry** about pricing.
   - **Instagram story/DM** asking to book an appointment.
   - **Facebook message** demanding human assistance.
   - **Twilio Voice call transcription** requesting a scheduled meeting.
4. Each payload is ingested, queued in BullMQ, and processed in the background by the AI Orchestration layer.
5. In the backend console logs, watch the RAG matching, LLM completion triggers, tool calls, status transitions, and outbound routing.
6. Open `http://localhost:3000` in your web browser to monitor threads, view CRM cards, and respond to customers in real-time.
