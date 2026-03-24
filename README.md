# ShiftCheck v3 — Full Setup Guide

Pre clock-out task management with Paycor OAuth, backup local accounts,
SMS notifications via Twilio, and a Supabase database.

---

## What's in this version

| Feature | How it works |
|---|---|
| Paycor OAuth login | Employee taps "Sign in with Paycor" → redirected to Paycor → bounced back with token |
| Backup email/password login | Manager creates account → bcrypt-hashed → temp password sent by SMS |
| Force password change | First local login redirects to /change-password screen |
| Manager task assignment | Assign recurring tasks per employee → SMS notification sent |
| Employee task swap | Auto-approved, both parties + manager notified by SMS |
| 30-min shift reminder | Netlify cron checks Paycor schedules every 15 mins → SMS reminder |
| Supabase database | All users, tasks, completions, and swaps persisted securely |

---

## Project structure

```
shiftcheck-v3/
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── index.html
│   ├── store/
│   │   └── AppContext.jsx          State management (React Context)
│   ├── screens/
│   │   ├── LoginScreen.jsx         Paycor SSO + backup email login
│   │   ├── ChangePasswordScreen.jsx  Force password reset on first login
│   │   ├── EmployeeHome.jsx        Task list, mark done, swap
│   │   └── ManagerHome.jsx         Team overview, assign, swap log
│   └── components/
│       ├── SwapModal.jsx
│       ├── TaskCompletionModal.jsx
│       ├── AssignTaskModal.jsx
│       ├── EditTaskModal.jsx
│       └── CreateBackupAccountModal.jsx
│
├── netlify/functions/
│   ├── auth-start.js               Redirects to Paycor OAuth
│   ├── auth-callback.js            Handles Paycor code → token exchange
│   ├── login.js                    Local email/password login
│   ├── change-password.js          Updates password hash, clears flag
│   ├── logout.js                   Clears session cookie
│   ├── create-backup-account.js    Manager creates local account + SMS
│   ├── submit-checklist.js         Employee submits end-of-shift + SMS
│   ├── notify-assignment.js        SMS when task assigned
│   ├── notify-swap.js              SMS for both parties + manager on swap
│   └── shift-reminder.js           Cron: 30-min warning SMS via Paycor API
│
├── supabase/
│   └── schema.sql                  Run once in Supabase SQL editor
│
├── netlify.toml
├── .env.example
└── package.json
```

---

## Step 1 — Install dependencies

```bash
npm install
npm install -g netlify-cli
```

---

## Step 2 — Set up Supabase (free)

1. Go to https://supabase.com and create a free project
2. Go to **SQL Editor → New Query**
3. Paste the contents of `supabase/schema.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (keep secret!)
   - **anon key** → `SUPABASE_ANON_KEY`

---

## Step 3 — Set up Twilio (free trial)

1. Sign up at https://twilio.com
2. Get a phone number (free trial includes one)
3. Copy **Account SID**, **Auth Token**, and your **Twilio number**

---

## Step 4 — Set up Paycor OAuth

1. Go to https://developers.paycor.com and sign in
2. Click **Applications → + Application → Standard Application**
3. Set the redirect URI to:
   `https://your-site.netlify.app/.netlify/functions/auth-callback`
4. Copy **Client ID**, **Client Secret**, and **Subscription Key**
5. Your **Legal Entity ID** = your Paycor ClientID (found in company settings)

> Note: Paycor OAuth requires partner approval for production use.
> During development, use the DEV profile picker (visible only in `npm run dev`).

---

## Step 5 — Configure environment variables

```bash
cp .env.example .env
# Fill in all values
```

---

## Step 6 — Run locally

```bash
netlify dev
```

This starts both the React app and all Netlify Functions locally.
In dev mode, a **DEV profile picker** appears on the login screen so you can
test without real Paycor credentials.

---

## Step 7 — Deploy to Netlify

```bash
netlify init        # connect to your Netlify account
netlify deploy --prod
```

Then go to **Netlify Dashboard → Site → Environment Variables** and add
every variable from `.env.example`.

---

## Security summary

| What | How it's protected |
|---|---|
| Paycor password | Never touches your app — typed on Paycor's domain |
| Backup passwords | bcrypt (cost 12) — only hash stored, never plaintext |
| Database | Supabase Row Level Security — anon key is read-only |
| Sessions | HttpOnly + Secure cookies — inaccessible to JavaScript |
| Data at rest | Supabase AES-256 encryption |
| Data in transit | HTTPS / TLS everywhere |
| First login | Temp password forced to change immediately |

---

## Customising tasks and employees

Edit the seed data in `src/store/AppContext.jsx` for local dev, or insert
rows directly into Supabase for production. The manager's **+ Assign Task**
button creates tasks that persist to Supabase via `notify-assignment.js`.
