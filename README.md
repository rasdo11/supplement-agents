# Autonomous Supplement Research Agents

Two AI agents that research daily and email you a combined briefing every morning at 7am ET.

## What they do

**Sourcing Agent** — rotates through a weekly research calendar:
- Mon: Manufacturer intel (reviews, news about Makers/NutraScience/Vitalpax)
- Tue: Pricing research (what people are actually paying for contract manufacturing)
- Wed: Raw material costs (wholesale creatine monohydrate, magnesium glycinate)
- Thu: Competitor analysis (DTC brands, positioning, pricing)
- Fri: Lead time intelligence (real-world turnaround times)
- Sat: Amazon landscape (competitor products, reviews, keywords)
- Sun: Alternative manufacturers (hidden gems, low-MOQ specialists)

**Formulation Scientist** — rotates through a weekly research calendar:
- Mon: Stability science (does creatine actually degrade? Is "freshness" defensible?)
- Tue: Magnesium forms (glycinate vs. threonate vs. citrate — latest research)
- Wed: Dosing optimization (minimum effective dose for wellness, not athletics)
- Thu: Synergy ingredients (what third ingredient strengthens the formula?)
- Fri: Regulatory landscape (FDA enforcement, safe claims)
- Sat: Women's health angle (creatine for perimenopause, cognition, bone density)
- Sun: Competitive formulation analysis (what's in competing products?)

## Setup (15 minutes)

### 1. Create a private GitHub repo

```bash
mkdir supplement-agents
cd supplement-agents
git init
```

Copy these files into the repo:
```
supplement-agents/
├── agents/
│   └── daily-briefing.mjs
├── .github/
│   └── workflows/
│       └── daily-agents.yml
└── README.md
```

### 2. Get your API keys

**Anthropic API key** (required):
- Go to https://console.anthropic.com
- Create an API key
- The daily run costs roughly $0.10-0.30/day (two Sonnet calls with web search)
- That's about $3-9/month

**Resend API key** (for email delivery):
- Go to https://resend.com and sign up (free tier = 100 emails/day)
- Get your API key from the dashboard
- Verify a sender domain, or use their test domain for initial testing
- Alternative: Use SendGrid, Postmark, or any email API — just swap the fetch call in the script

### 3. Set GitHub repository secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret

Add three secrets:
| Secret name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `RESEND_API_KEY` | Your Resend API key |
| `ROSS_EMAIL` | Your email address |

### 4. Update the sender address

In `agents/daily-briefing.mjs`, find the line:
```javascript
from: 'agents@yourdomain.com',
```
Replace with your verified Resend sender address.

### 5. Push and test

```bash
git add .
git commit -m "Initial agent setup"
git remote add origin git@github.com:YOUR_USERNAME/supplement-agents.git
git push -u origin main
```

To test immediately without waiting for the cron:
1. Go to your repo on GitHub
2. Click **Actions** tab
3. Click **Daily Agent Briefing** workflow
4. Click **Run workflow** → **Run workflow**
5. Check your email in ~2 minutes

### 6. Sit back

The agents run every day at 7am ET automatically. You'll get one email with both briefings.

## Cost

- **Anthropic API**: ~$0.10-0.30/day (2 Sonnet calls with web search)
- **GitHub Actions**: Free (2,000 minutes/month on free tier, each run takes ~1-2 min)
- **Resend**: Free (100 emails/day on free tier)
- **Total**: ~$3-9/month

## Customizing

### Change the delivery time
Edit `.github/workflows/daily-agents.yml`:
```yaml
- cron: '0 12 * * *'  # 12:00 UTC = 7am ET (during EDT)
```
Cron format is `minute hour day month weekday` in UTC.

### Change the research topics
Edit the system prompts in `agents/daily-briefing.mjs`. Each day of the week has a topic. Swap them, add new ones, or change the rotation.

### Add more agents
Copy the pattern — add a third system prompt, a third `runAgent()` call in `main()`, and include it in the email body. Ideas:
- **Brand/Marketing Agent**: Researches positioning, naming, packaging trends
- **Regulatory Agent**: Monitors FDA actions, label requirements, state laws
- **Audience Agent**: Researches the target demographic, their habits, where they hang out

### Make agents "remember"
Currently each day's research is independent. To give agents memory:
1. Store each day's briefing as a JSON file in the repo (commit from the Action)
2. Include the last 3-5 briefings in the API context window
3. This lets agents build on previous findings instead of starting fresh

This adds complexity but makes the briefings much more useful over time.

## What a briefing looks like

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAILY AGENT BRIEFING — Monday, 2026-03-23
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOURCING BRIEFING — Manufacturer Intel — 2026-03-23

Key finding: NutraScience Labs recently expanded to a new distribution
center in Hauppauge, NY, suggesting increased capacity and potentially
faster turnaround times for new clients.

• Makers Nutrition won a Gold Stevie Award in 2025 for small company
  manufacturing — signals operational maturity
• Vitalpax CEO Dalyon Ruesch was elected to an industry board position,
  which could mean leadership attention is split but also signals
  growing industry credibility
• Recent Reddit thread (r/supplementindustry) reports 5-week average
  turnaround from NutraScience for simple capsule orders
• No negative BBB complaints filed against any of the three in the
  last 6 months

RECOMMENDED ACTION: Call NutraScience first on Monday — their
expansion suggests they have capacity and may be hungry for new
business. Ask specifically about the Hauppauge facility's impact
on lead times.

───────────────────────────────────────

SCIENCE BRIEFING — Stability Science — 2026-03-23

Key finding: Creatine monohydrate is one of the most stable
supplement ingredients when stored as a dry powder. A 2023 study
in the Journal of the International Society of Sports Nutrition
found less than 2% degradation to creatinine over 36 months at
room temperature in sealed containers.

• The "freshness" angle is scientifically WEAKER for creatine
  than for many other supplements — it simply doesn't degrade
  much. Honesty check: this is more brand story than hard science.
• WHERE freshness matters: magnesium glycinate is more hygroscopic
  and can clump/degrade faster in humid conditions. The freshness
  angle is more defensible for the magnesium component.
• Better framing: "made in small batches for quality control"
  rather than "fresh = more potent." The QC angle is unimpeachable.
• Creatinine conversion accelerates in liquid (solution) form
  and at high temperatures — this is why powder/capsule is the
  right format choice.

FORMULA RECOMMENDATION: Lean into "small-batch quality" rather
than "freshness preserves potency" for the creatine specifically.
For magnesium, the freshness claim is more defensible. Consider
positioning as "made to order for peak quality" — true, defensible,
and avoids potency claims that the creatine science won't support.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
