# Setup — Do These Steps In Order

Total time: ~15 minutes. You need a GitHub account and an Anthropic API key.

---

## Step 1: Get your Anthropic API key (2 min)

You may already have one from the Lip Service pipeline work.

1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it "supplement-agents"
4. Copy the key (starts with `sk-ant-...`) — you'll need it in Step 4
5. Make sure you have credits loaded (this costs ~$0.15/day = ~$5/month)

---

## Step 2: Get a Resend API key for email delivery (3 min)

1. Go to https://resend.com and sign up (free, no credit card)
2. In the dashboard, go to API Keys → Create API Key
3. Copy the key (starts with `re_...`)
4. For now, you can send FROM `onboarding@resend.dev` (their test address)
5. Later, verify your own domain for a branded sender address

---

## Step 3: Create the GitHub repo (5 min)

Option A — If you're comfortable with git:
```bash
cd ~/Projects  # or wherever you keep repos
git clone <this-folder-as-a-zip-or-copy-the-files>
# or create fresh:
mkdir supplement-agents
cd supplement-agents
git init
# copy all files from this package into the repo
git add .
git commit -m "Initial agent setup"
```

Then create a new PRIVATE repo on github.com:
1. Go to https://github.com/new
2. Name: `supplement-agents`
3. Visibility: **Private**
4. Don't initialize with README (you already have one)
5. Click Create
6. Follow the "push an existing repository" instructions:
```bash
git remote add origin https://github.com/YOUR_USERNAME/supplement-agents.git
git branch -M main
git push -u origin main
```

Option B — If you want the easiest path:
1. Go to https://github.com/new
2. Name: `supplement-agents`, Private
3. Click "Create repository"
4. Click "uploading an existing file"
5. Drag and drop ALL files from this package (including the `.github` folder)
6. Commit

**Important:** Make sure the `.github/workflows/daily-agents.yml` file is at that exact path. GitHub Actions only works if the workflow file is in `.github/workflows/`.

---

## Step 4: Add your secrets to GitHub (2 min)

1. Go to your repo on GitHub
2. Click **Settings** (tab at the top)
3. In the left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret** for each:

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your `sk-ant-...` key from Step 1 |
| `RESEND_API_KEY` | Your `re_...` key from Step 2 |
| `ROSS_EMAIL` | The email where you want briefings delivered |

---

## Step 5: Update the sender address (1 min)

Open `agents/daily-briefing.mjs` and find this line (~line 175):
```javascript
from: 'agents@yourdomain.com',
```

Change it to:
```javascript
from: 'onboarding@resend.dev',
```

(This is Resend's test sender. It works immediately. Later you can verify your own domain.)

Commit and push this change.

---

## Step 6: Test it (2 min)

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. You should see "Daily Agent Briefing" in the left sidebar
4. Click on it
5. Click the **Run workflow** dropdown button (right side)
6. Click the green **Run workflow** button
7. Wait ~1-2 minutes for it to complete (watch the progress)
8. Check your email

If it worked, you'll get a briefing with both agents' findings for today.

---

## Step 7: You're done

The agents will now run automatically every day at 7am ET. You don't need to do anything else.

Check the Actions tab anytime to see run history and logs.

---

## Troubleshooting

**"No workflow found"**: The `.github/workflows/daily-agents.yml` file isn't in the right place. It MUST be at exactly `.github/workflows/daily-agents.yml` from the repo root.

**Action fails with API error**: Check that your `ANTHROPIC_API_KEY` secret is correct and has credits. Go to console.anthropic.com to verify.

**No email received**: Check that `ROSS_EMAIL` is correct. Check spam. If using Resend's test domain, emails may land in spam the first time.

**Want a different time**: Edit `.github/workflows/daily-agents.yml`. The cron `0 12 * * *` means 12:00 UTC = 7am ET during summer / 7am ET during winter. Change to `0 14 * * *` for 9am ET, etc.

---

## Later upgrades (optional, not needed now)

- **Verify a custom domain on Resend** so emails come from `agents@yourbrand.com`
- **Add agent memory** — store briefings as JSON files in the repo so agents can reference past findings
- **Add more agents** — brand/marketing agent, regulatory agent, audience research agent
- **Slack instead of email** — swap the Resend call for a Slack webhook
