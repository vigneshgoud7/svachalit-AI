<p align="center">
  <img src="https://img.shields.io/badge/AutoBot-Multi--Channel%20Automation-ff5c8a?style=for-the-badge" alt="AutoBot badge" />
  <img src="https://img.shields.io/badge/AI-Orchestration-7c3aed?style=for-the-badge" alt="AI orchestration badge" />
  <img src="https://img.shields.io/badge/Realtime-Agent%20Dashboard-06b6d4?style=for-the-badge" alt="Realtime dashboard badge" />
</p>

<h1 align="center">AutoBot</h1>

<p align="center">
  <strong>A colorful, production-minded hub for WhatsApp, Instagram, Facebook Messenger, and voice automation.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-22c55e" alt="Backend stack" />
  <img src="https://img.shields.io/badge/Frontend-Next.js%2014-111827" alt="Frontend stack" />
  <img src="https://img.shields.io/badge/Queue-BullMQ%20%2B%20Redis-ef4444" alt="Queue stack" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%2B%20pgvector-3b82f6" alt="Database stack" />
  <img src="https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI%20%7C%20OpenRouter-f59e0b" alt="AI providers" />
</p>

---

## <span style="color:#ff5c8a">What It Does</span>

AutoBot is a modular **hub-and-spoke business automation platform** for handling inbound conversations across Meta channels and voice providers. It normalizes messages into one format, queues work with Redis-backed BullMQ, enriches replies with RAG over a pgvector knowledge base, runs AI tool-call pipelines, and routes responses back to the right channel.

It also includes a **live agent dashboard** built with Next.js App Router and Server-Sent Events. Agents can monitor conversations in real time, capture lead details, override AI replies, and hand customers to humans when needed.

---

## <span style="color:#7c3aed">Color Map</span>

| Color | Layer | What lives there |
| --- | --- | --- |
| <span style="color:#ff5c8a">Pink</span> | Channels | WhatsApp, Instagram DM, Facebook Messenger, Twilio/Vapi voice |
| <span style="color:#7c3aed">Purple</span> | AI brain | RAG, provider routing, tool calls, structured responses |
| <span style="color:#06b6d4">Cyan</span> | Realtime UX | SSE streams, live inbox, CRM updates |
| <span style="color:#22c55e">Green</span> | Operations | Queue workers, retries, manual handoff |
| <span style="color:#f59e0b">Amber</span> | Data | Prisma, PostgreSQL, pgvector knowledge chunks |

---

## <span style="color:#06b6d4">Architecture</span>

```text
Inbound Channels
  WhatsApp | Instagram | Facebook | Voice
        |
        v
Express Webhooks
        |
        v
BullMQ + Redis Queue
        |
        v
AI Orchestrator
  History + RAG + Tool Calls
        |
        v
Outbound Router
  Meta APIs | Twilio/Vapi | Agent Dashboard
```

### Backend: `backend/`

- **Runtime:** Node.js, TypeScript, Express
- **Database:** Prisma ORM, PostgreSQL, pgvector-ready RAG storage
- **Queue:** Redis and BullMQ for webhook buffering, retries, and worker processing
- **AI providers:** Gemini, OpenAI, and OpenRouter compatible configuration
- **Channels:** Meta webhooks plus voice completion routes

### Frontend: `frontend/`

- **Framework:** Next.js 14 App Router with TypeScript
- **Styling:** Tailwind CSS with dashboard-focused UI
- **Realtime:** Server-Sent Events for live thread and CRM synchronization
- **Agent tools:** Manual replies, status updates, conversation monitoring

---

## <span style="color:#22c55e">Project Structure</span>

```text
autoBot/
|-- backend/
|   |-- prisma/
|   |   `-- schema.prisma              # PostgreSQL schema
|   |-- src/
|   |   |-- config/env.ts              # Environment loader
|   |   |-- db/client.ts               # Prisma client adapter
|   |   |-- queues/
|   |   |   |-- messageQueue.ts         # BullMQ queue definition
|   |   |   `-- messageWorker.ts        # Async message processor
|   |   |-- routes/
|   |   |   |-- webhookRoutes.ts        # Meta and channel webhooks
|   |   |   `-- voiceCompletion.ts      # Voice completion route
|   |   |-- services/
|   |   |   |-- aiOrchestrator.ts       # Core AI orchestration
|   |   |   |-- ragService.ts           # Embeddings and similarity search
|   |   |   |-- toolService.ts          # Business tool calls
|   |   |   `-- outboundRouter.ts       # Channel response adapters
|   |   `-- index.ts                   # API, SSE, and agent endpoints
|   |-- package.json
|   `-- test-webhooks.js               # End-to-end mock webhook runner
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |   |-- page.tsx                # Live agent inbox and CRM dashboard
|   |   |   |-- layout.tsx
|   |   |   `-- globals.css
|   |   `-- lib/utils.ts
|   |-- package.json
|   `-- tailwind.config.js
|-- docker-compose.yml
|-- DEPLOYMENT.md
`-- README.md
```

---

## <span style="color:#f59e0b">Quick Start</span>

### Option 1: Docker Compose

```bash
docker compose up --build
```

Then open:

- Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:4000`

### Option 2: Local Development

Start PostgreSQL and Redis first, then configure the backend.

```bash
cd backend
npm install
```

Create `backend/.env`:

```ini
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/multichannel_db?schema=public"
REDIS_URL="redis://localhost:6379"
GEMINI_API_KEY=""
OPENAI_API_KEY=""
OPENROUTER_API_KEY=""
META_VERIFY_TOKEN="multichannel_verify_token_123"
JWT_SECRET="change-me"
```

Prepare Prisma and start the API:

```bash
npx prisma db push
npx prisma generate
npm run dev
```

In another terminal, start the dashboard:

```bash
cd frontend
npm install
npm run dev
```

---

## <span style="color:#ff5c8a">Webhook Test Run</span>

The backend includes a mock seed and webhook generator script that exercises the full pipeline.

```bash
cd backend
node test-webhooks.js
```

It will:

1. Seed a demo tenant, customer, knowledge base chunks, and conversation.
2. Capture the generated tenant API key.
3. Send mock inbound events for WhatsApp, Instagram, Facebook, and voice.
4. Push each event through BullMQ and the AI orchestration layer.
5. Show RAG matches, tool calls, status transitions, and outbound routing in backend logs.
6. Update the dashboard at `http://localhost:3000` in real time.

---

## <span style="color:#7c3aed">Useful Scripts</span>

| Location | Command | Purpose |
| --- | --- | --- |
| `backend/` | `npm run dev` | Run the Express API and worker in watch mode |
| `backend/` | `npm run build` | Compile TypeScript |
| `backend/` | `npm run start` | Start compiled backend from `dist/` |
| `backend/` | `npm run prisma:generate` | Generate Prisma client |
| `backend/` | `npm run prisma:migrate` | Run development migrations |
| `frontend/` | `npm run dev` | Start Next.js on port `3000` |
| `frontend/` | `npm run build` | Build the dashboard |
| `frontend/` | `npm run start` | Start the production Next.js server |

---

## <span style="color:#06b6d4">Core API Surfaces</span>

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/` | `GET` | Backend health response |
| `/api/v1/stream` | `GET` | Server-Sent Events stream for dashboard updates |
| `/api/v1/conversations` | `GET` | List conversations with latest messages |
| `/api/v1/conversations/:id` | `GET` | Read a full conversation |
| `/api/v1/conversations/:id/reply` | `POST` | Send a manual agent reply |
| `/api/v1/conversations/:id/status` | `PATCH` | Update conversation status |
| `/api/v1/dev/seed` | `POST` | Seed demo data and queue a test message |
| `/api/v1/test-ai` | `POST` | Queue a manual AI test prompt |

---

## <span style="color:#22c55e">Deployment Notes</span>

- Update `NEXT_PUBLIC_API_URL` or the frontend backend URL configuration for your deployed API host.
- Set real channel credentials before enabling production outbound responses.
- Use strong values for `JWT_SECRET`, provider API keys, and webhook verify tokens.
- Keep Redis and PostgreSQL close to the backend worker for lower queue latency.
- See `DEPLOYMENT.md` for deeper deployment guidance.

---

<p align="center">
  <strong>Built for fast-moving support, sales, and operations teams that need AI automation with a human handoff.</strong>
</p>
