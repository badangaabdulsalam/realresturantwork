# Go Live (Render + Supabase)

This repo is now ready for a two-service Render deploy:
- `restaurant-backend` (Node API)
- `restaurant-frontend` (static site built from `dist/`)

Render reads both services from `render.yaml`.

## 0) Pre-flight (local)
From project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\start-local.ps1
powershell -ExecutionPolicy Bypass -File .\server\smoke-test.ps1
powershell -ExecutionPolicy Bypass -File .\server\stop-local.ps1
```

## 1) Create Supabase table
1. Open Supabase SQL Editor.
2. Run `server/supabase-schema.sql`.

## 2) Push repo to GitHub
Render Blueprint deploy needs this project in a GitHub repo.

## 3) Deploy via Render Blueprint
1. In Render Dashboard: `New` -> `Blueprint`.
2. Select this repository.
3. Render will detect `render.yaml` and create both services.

## 4) Fill required Render environment variables
Set these for `restaurant-backend`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

PASSWORD_RESET_EMAIL_API_KEY=YOUR_RESEND_KEY
PASSWORD_RESET_EMAIL_FROM=My Testing Restaurant <no-reply@yourdomain.com>
PASSWORD_RESET_EMAIL_REPLY_TO=support@yourdomain.com

RESTAURANT_DASHBOARD_TOKEN=use-a-long-random-token
RESTAURANT_INVITE_CODE=optional-staff-invite-code
RESTAURANT_STAFF_EMAILS=owner@example.com,manager@example.com
```

You can copy from:
- `server/render-backend.env.example`

Set these for `restaurant-frontend`:

```env
FRONTEND_ORDER_API_BASE_URL=https://YOUR-BACKEND-SERVICE.onrender.com
FRONTEND_PAYMENT_VERIFY_ENDPOINT=https://YOUR-BACKEND-SERVICE.onrender.com/verify-payment
FRONTEND_PAYSTACK_PUBLIC_KEY=pk_live_xxx_or_pk_test_xxx
```

You can copy from:
- `server/render-frontend.env.example`

Notes:
- `FRONTEND_ORDER_API_BASE_URL` is critical. It makes all public visitors hit your live backend automatically.
- If you rotate backend URL, update frontend env and redeploy frontend service.

## 5) One-time data migration (optional)
If you want existing local users/orders moved into Supabase:

```powershell
C:\Program Files\nodejs\node.exe .\server\migrate-json-to-supabase.js
```

This command reads local JSON files and writes into Supabase state rows.

## 6) Production verification checklist
1. Backend health: `https://YOUR-BACKEND-SERVICE.onrender.com/health`
2. Frontend opens without console/network API errors.
3. Register + Login works.
4. Checkout places order.
5. Dashboard can confirm/reject order.
6. Password reset request works.

## 7) Make it public to everyone
1. Use the frontend Render URL as your public link immediately.
2. (Recommended) Attach custom domain to frontend service.
3. Attach custom domain to backend service (optional but cleaner API URL).
4. Enable HTTPS (automatic on Render).

## 8) Emergency fallback
If frontend cannot reach backend after deploy:
1. Open `Account` -> `Live API Settings`.
2. Set Backend API Base URL and Payment Verify Endpoint.
3. Click `Save API Settings` and `Test Connection`.
