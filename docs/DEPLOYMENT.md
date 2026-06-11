# Deployment Guide

This guide covers the deployment of the Road Warrior EV frontend to **Vercel** and the backend to **Render**.

## 1. Environment Variables Preparation

### Backend (Render)
You will need the following environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key (or anon key depending on setup, but backend usually needs service role to bypass RLS for admin tasks)
- `JWT_SECRET`: A secure random string for JWT token signing
- `JWT_ALGORITHM`: `HS256`
- `FAST2SMS_API_KEY`: Your Fast2SMS API key for OTPs
- `WHATSAPP_TOKEN`: Meta WhatsApp API token
- `PHONE_NUMBER_ID`: Meta WhatsApp Phone Number ID

### Frontend (Vercel)
You will need the following environment variables:
- `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://road-warrior-backend.onrender.com/api`)
- `VITE_RECAPTCHA_SITE_KEY`: Your Google reCAPTCHA v3 Site Key

## 2. Deploying Backend to Render

1. Create an account on [Render.com](https://render.com).
2. Connect your GitHub repository.
3. We have included a `render.yaml` file in the repository root. Render will detect this and automatically configure a Web Service named `road-warrior-ev-backend`.
4. Render will prompt you to fill in the environment variables (defined in `render.yaml` as sync: false). Fill them out using the list above.
5. Click **Apply Changes** to trigger the build.
6. Copy the resulting `.onrender.com` URL to use in your Frontend environment variables.

## 3. Deploying Frontend to Vercel

1. Create an account on [Vercel.com](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository.
3. Vercel will auto-detect Vite. The root directory should be set to `frontend`.
4. Expand **Environment Variables** and add `VITE_API_URL` and `VITE_RECAPTCHA_SITE_KEY`.
5. Click **Deploy**.
6. (Optional) Go to the project settings to configure a Custom Domain.

## 4. Production Checklist
- [ ] Database schema is applied in Supabase SQL editor (`docs/DATABASE.sql`).
- [ ] Frontend uses HTTPS.
- [ ] reCAPTCHA is verified to be working.
- [ ] Fast2SMS has sufficient balance.
- [ ] Meta WhatsApp App is live.
