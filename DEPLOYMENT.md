# Production Deployment Guide

This document outlines the procedures for deploying the Multi-Channel Auto Reply, Voice, and Business Automation Platform to production.

---

## Deployment Architectures

You can deploy the platform in two ways:

1.  **Fully Managed Cloud (Railway + Vercel)**:
    *   **PostgreSQL, Redis, and Express Backend**: Hosted on **Railway.app** (simplest setup for services + databases).
    *   **Next.js Frontend Dashboard**: Hosted on **Vercel** (fast, global CDN, native Next.js support).
2.  **Self-Hosted VPS (Docker Compose)**:
    *   Deploy the entire stack (PostgreSQL + pgvector, Redis, Express backend, and Next.js frontend) to any VPS (DigitalOcean, AWS, Linode) in a single command using Docker.

---

## Option 1: Managed Cloud Deployment (Recommended)

### A. Deploy Databases and Backend on Railway.app
1.  Sign in to [Railway.app](https://railway.app).
2.  Click **New Project** ➡️ **Provision PostgreSQL**.
3.  Click **New Service** ➡️ **Provision Redis**.
4.  Link your Github Repository:
    *   Click **New Service** ➡️ **GitHub Repository** ➡️ select your repository.
    *   In the service settings, set the **Root Directory** to `backend`.
5.  Configure the following Environment Variables in the Backend service:
    *   `PORT` = `4000`
    *   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway references this automatically)
    *   `REDIS_URL` = `${{Redis.REDIS_URL}}` (Railway references this automatically)
    *   `GEMINI_API_KEY` = `your-gemini-api-key`
    *   `META_VERIFY_TOKEN` = `your-meta-webhook-verify-token`
    *   `JWT_SECRET` = `a-long-secure-random-string`
6.  Railway will automatically compile TypeScript, run Prisma pushes, and start the Express server + worker. Copy the public **Reference URL** provided by Railway (e.g., `https://backend-production.up.railway.app`).

### B. Deploy Frontend on Vercel
1.  Sign in to [Vercel.com](https://vercel.com).
2.  Click **Add New** ➡️ **Project** ➡️ Import your Github Repository.
3.  In the project setup:
    *   Set the **Framework Preset** to **Next.js**.
    *   Set the **Root Directory** to `frontend`.
4.  Configure the Environment Variables:
    *   `NEXT_PUBLIC_API_URL` = `https://backend-production.up.railway.app` *(The Railway backend URL you copied)*
5.  Click **Deploy**. Vercel will build the frontend and provide your production dashboard URL.

---

## Option 2: Self-Hosted VPS Deployment (Docker Compose)

We have provided a [docker-compose.yml](file:///C:/Users/Saipr_gbasjrv/.gemini/antigravity/scratch/multichannel-automation/docker-compose.yml) in the root directory that spins up the entire stack, including a pre-configured `pgvector` database container.

### Step 1: Copy files to your VPS
SSH into your VPS and clone the project:
```bash
git clone <your-repo-link> multichannel-automation
cd multichannel-automation
```

### Step 2: Configure Environment
Create an `.env` file in the root directory of your VPS project:
```ini
GEMINI_API_KEY="your-gemini-api-key"
META_VERIFY_TOKEN="your-chosen-meta-verification-token"
JWT_SECRET="generate-a-secure-random-jwt-key"
```

### Step 3: Launch Containers
Run the Docker Compose launch command:
```bash
docker-compose up -d --build
```
This command builds the frontend and backend, sets up Postgres with pgvector, configures Redis, runs Prisma database migrations, and boots all services.

### Step 4: Configure Domains & SSL (Nginx Reverse Proxy)
To connect real phone calls and Meta webhooks, you need SSL enabled. Install Nginx and certbot on your VPS to proxy requests:

Configure your Nginx block (usually `/etc/nginx/sites-available/default`):
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name dashboard.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Run certbot to acquire SSL certificates:
```bash
sudo certbot --nginx -d api.yourdomain.com -d dashboard.yourdomain.com
```

---

## Production Webhook Configurations

Once your production domains are live and SSL-enabled:

1.  **WhatsApp / Instagram / Facebook**:
    *   Update your webhook URLs in the **Meta Developer Portal** to:
        `https://api.yourdomain.com/api/v1/webhooks/whatsapp?apiKey=YOUR_TENANT_API_KEY`
2.  **Vapi Voice AI**:
    *   Update the **Custom LLM URL** in the Vapi Assistant dashboard to:
        `https://api.yourdomain.com/api/v1/voice/completion?apiKey=YOUR_TENANT_API_KEY`
    *   Update the **Server Webhook URL** to:
        `https://api.yourdomain.com/api/v1/webhooks/voice?apiKey=YOUR_TENANT_API_KEY`
