# Road Warrior EV Deployment Guide

This guide covers deploying the backend to Render, the frontend to Vercel, and setting up Supabase.

## 1. Supabase Database
1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Settings > Database** and copy the Connection String (`DATABASE_URL`).
3. Note your `SUPABASE_URL` and `SUPABASE_KEY`.

## 2. Backend Deployment (Render)
1. Push this repository to GitHub.
2. Log into [Render](https://render.com) and click **New > Blueprint**.
3. Connect your repository.
4. Render will automatically detect the `render.yaml` file and configure the service.
5. Provide the required Environment Variables in the Render Dashboard when prompted:
   - `DATABASE_URL` (From Supabase)
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `FAST2SMS_API_KEY`
6. The `buildCommand` automatically runs Alembic migrations against Supabase.

## 3. Frontend Deployment (Vercel)
1. Log into [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Edit the Root Directory to be `web`.
4. The `vercel.json` and Framework Preset (Next.js) will be automatically applied.
5. Add the Environment Variable:
   - `NEXT_PUBLIC_API_URL` = (Your Render backend URL, e.g., `https://road-warrior-backend.onrender.com`)
6. Click **Deploy**.

## 4. n8n Automation
1. Log into your n8n instance.
2. Create a new Workflow and click **Import from File**.
3. Select `automation/n8n_whatsapp_workflow.json`.
4. Configure the Webhook node to point to your Supabase trigger (or standard HTTP webhook endpoint).
5. Add your Fast2SMS or WhatsApp Cloud API credentials to the HTTP Request node.
6. Activate the workflow.
