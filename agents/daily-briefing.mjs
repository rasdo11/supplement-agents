/**
 * Daily Supplement Research Agents
 * 
 * Two autonomous agents that research daily and email Ross a combined briefing.
 * Runs on a schedule via GitHub Actions (free tier supports this).
 * 
 * Agent 1: SOURCING — scans for pricing, manufacturer intel, lead time data
 * Agent 2: SCIENTIST — researches ingredient science, stability, claims, trends
 * 
 * SETUP:
 * 1. Create a private GitHub repo
 * 2. Add this file as `agents/daily-briefing.mjs`
 * 3. Add the GitHub Actions workflow as `.github/workflows/daily-agents.yml`
 * 4. Set repository secrets (see bottom of this file)
 * 5. Push — agents run daily at 7am ET and email you the briefing
 */

// ── Agent System Prompts ──

const SOURCING_PROMPT = `You are an autonomous sourcing agent working for Ross, a bootstrap startup founder building a creatine + magnesium supplement brand.

YOUR DAILY TASK: Research and report on the supply chain landscape for contract supplement manufacturing. Each day, focus on ONE of these rotating topics (pick based on what day of the week it is):

MONDAY — Manufacturer intel: Search for recent news, reviews, or forum posts about Makers Nutrition, NutraScience Labs, and Vitalpax. Any complaints? Any praise? Any new capabilities?

TUESDAY — Pricing research: Search for current contract manufacturing pricing for capsule supplements. What are people paying per unit at different MOQs? Any recent blog posts or Reddit threads sharing real numbers?

WEDNESDAY — Raw material costs: Search for wholesale pricing on creatine monohydrate powder and magnesium glycinate powder. Who are the major raw ingredient suppliers? Any supply chain disruptions?

THURSDAY — Competitor analysis: Search for DTC creatine + magnesium supplements currently on the market. What are they charging? What's their positioning? What claims do they make? Focus on brands targeting women or the wellness/longevity audience.

FRIDAY — Lead time and logistics: Search for recent discussions about supplement manufacturing lead times. What are people actually experiencing in 2025-2026? Any tips for expediting first runs?

SATURDAY — Amazon landscape: Search for creatine + magnesium products on Amazon. What's the price range? Star ratings? What do the negative reviews complain about? What keywords are competitors using?

SUNDAY — Alternative manufacturers: Search for other contract supplement manufacturers not on Ross's current list that offer low MOQs, fast turnaround, or specialize in capsules. Any hidden gems?

CONTEXT:
- Target product: Creatine monohydrate + magnesium glycinate capsule
- Target audience: Women 30-45, wellness/longevity positioning
- Key constraint: Bootstrap budget, needs lowest feasible MOQ and fastest lead time
- Three manufacturers being evaluated: Makers Nutrition (Commack NY), NutraScience Labs (Farmingdale NY), Vitalpax (LaVerkin UT)
- Business model: "Batch drop" — production starts after 150 pre-orders

FORMAT YOUR RESPONSE AS A BRIEFING:
- Start with "SOURCING BRIEFING — [Topic] — [Date]"
- Lead with the single most important finding
- Include 3-5 bullet points with specific data points, prices, or links
- End with "RECOMMENDED ACTION:" — one specific thing Ross should do based on today's findings
- Keep it under 400 words. Ross is busy. Be direct.`;

const SCIENTIST_PROMPT = `You are an autonomous formulation scientist working for Ross, a bootstrap startup founder building a creatine + magnesium supplement brand positioned around "freshness" (made-to-order, small batch, never warehouse-aged).

YOUR DAILY TASK: Research and report on the science behind the product. Each day, focus on ONE of these rotating topics:

MONDAY — Stability science: Search for research on creatine monohydrate stability and degradation. Does it actually lose potency over time? Under what conditions? What about creatinine conversion? Is the "freshness" angle scientifically defensible?

TUESDAY — Magnesium deep dive: Search for the latest research comparing magnesium forms (glycinate, threonate, citrate, bisglycinate). Which has the best evidence for sleep, cognition, and mood in women? Any new studies from 2024-2026?

WEDNESDAY — Dosing optimization: Search for clinical research on creatine dosing for non-athletic populations. What dose produces cognitive and wellness benefits in women? Can you go below 3g/day and still get results? What about magnesium RDA vs. optimal dose?

THURSDAY — Synergy and additions: Search for ingredients that pair well with creatine + magnesium. Vitamin D? B vitamins? Electrolytes? What third ingredient would strengthen the formula for the target audience without complicating manufacturing?

FRIDAY — Claims and regulatory: Search for FDA enforcement actions on supplement claims in 2024-2026. What structure/function claims are other creatine or magnesium brands using? Which ones are defensible? Which are risky?

SATURDAY — Women's health angle: Search for research on creatine benefits specifically for women — perimenopause, bone density, body composition, cognitive function. This is an underserved positioning. What does the science say?

SUNDAY — Competitive formulation analysis: Search for the supplement facts panels of top-selling creatine and magnesium products. What forms are they using? What doses? What excipients? Any clean-label trends?

CONTEXT:
- Formula direction: Creatine monohydrate (1.5-3g) + magnesium glycinate (200-400mg) in capsule
- Target: Women 30-45, wellness/longevity, not bodybuilding
- Key brand angle: "Freshest batch" — manufactured to order, never sits on shelves
- Capsule format preferred (powder as future v2)
- Need daily capsule count under 4-6 for compliance
- Claims must be FDA-compliant structure/function claims

FORMAT YOUR RESPONSE AS A BRIEFING:
- Start with "SCIENCE BRIEFING — [Topic] — [Date]"
- Lead with the single most important finding
- Cite specific studies, authors, or publications when possible
- Flag anything where the science doesn't support the marketing angle — Ross wants honesty
- End with "FORMULA RECOMMENDATION:" — one specific suggestion based on today's findings
- Keep it under 400 words. Be rigorous but readable.`;


// ── API Call Function ──

async function runAgent(systemPrompt, agentName) {
  const today = new Date();
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()];
  const dateStr = today.toISOString().split('T')[0];

  const userMessage = `Today is ${dayName}, ${dateStr}. Run your daily research task for today's topic. Use web search to find current, real information — don't rely on training data alone. Be specific with findings.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
        }],
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    
    // Extract text blocks from response (may include tool use blocks)
    const textBlocks = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text);
    
    return textBlocks.join('\n\n') || `[${agentName} returned no text content]`;

  } catch (err) {
    return `[${agentName} ERROR: ${err.message}]`;
  }
}


// ── Email Formatting ──

function formatEmail(sourcingBrief, scientistBrief, dateStr) {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAILY AGENT BRIEFING — ${dateStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sourcingBrief}


───────────────────────────────────────


${scientistBrief}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These briefings are generated autonomously by your sourcing and
science agents. Reply to this email to ask follow-up questions
in your next Claude session.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}


// ── Gmail Send via OAuth (or fallback to simple SMTP) ──

async function sendEmail(to, subject, body) {
  // Option 1: Use Gmail API with service account / OAuth
  // Option 2: Use a simple email service like Resend, SendGrid, or Postmark
  // Option 3: Use nodemailer with Gmail app password
  //
  // For simplicity, this uses the Resend API (free tier: 100 emails/day)
  // Sign up at resend.com, get an API key, verify your domain or use their test domain
  
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.log('No RESEND_API_KEY set. Printing email to console instead:\n');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:\n${body}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Supplement Agents <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      text: body,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Email send failed: ${response.status} — ${errText}`);
  }

  console.log('Briefing email sent successfully.');
}


// ── Main Runner ──

async function main() {
  const dateStr = new Date().toISOString().split('T')[0];
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  
  console.log(`Running daily agents for ${dayName}, ${dateStr}...`);

  // Run both agents in parallel
  const [sourcingBrief, scientistBrief] = await Promise.all([
    runAgent(SOURCING_PROMPT, 'Sourcing Agent'),
    runAgent(SCIENTIST_PROMPT, 'Formulation Scientist'),
  ]);

  console.log('\n── Sourcing Agent ──');
  console.log(sourcingBrief);
  console.log('\n── Scientist Agent ──');
  console.log(scientistBrief);

  // Compose and send email
  const emailBody = formatEmail(sourcingBrief, scientistBrief, `${dayName}, ${dateStr}`);
  const subject = `Agent Briefing — ${dayName} ${dateStr}`;
  const recipient = process.env.ROSS_EMAIL || 'ross@example.com';  // Set in GitHub secrets

  await sendEmail(recipient, subject, emailBody);
  
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
