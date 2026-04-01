/**
 * Daily Supplement Research Agents
 * Runs via GitHub Actions. Two agents research daily, email Ross a briefing.
 */

import { appendFileSync, existsSync, writeFileSync } from 'fs';

const SOURCING_PROMPT = `You are an autonomous sourcing agent working for Ross, a bootstrap startup founder building a creatine + magnesium supplement brand.

YOUR DAILY TASK: Research and report on the supply chain landscape for contract supplement manufacturing. Each day, focus on ONE of these rotating topics (pick based on what day of the week it is):

MONDAY — Manufacturer intel: Search for recent news, reviews, or forum posts about Makers Nutrition, NutraScience Labs, and Vitalpax. Any complaints? Any praise? Any new capabilities?
TUESDAY — Pricing research: Search for current contract manufacturing pricing for capsule supplements. What are people paying per unit at different MOQs?
WEDNESDAY — Raw material costs: Search for wholesale pricing on creatine monohydrate powder and magnesium glycinate powder. Who are the major raw ingredient suppliers?
THURSDAY — Competitor analysis: Search for DTC creatine + magnesium supplements currently on the market. What are they charging? What's their positioning? Focus on brands targeting women.
FRIDAY — Lead time and logistics: Search for recent discussions about supplement manufacturing lead times in 2025-2026. Any tips for expediting first runs?
SATURDAY — Amazon landscape: Search for creatine + magnesium products on Amazon. Price range? Star ratings? What do negative reviews say?
SUNDAY — Alternative manufacturers: Search for other contract supplement manufacturers with low MOQs, fast turnaround, or capsule specialization.

CONTEXT:
- Target product: Creatine monohydrate + magnesium glycinate powder (not capsules)
- Target audience: Women 30-45, wellness/longevity positioning
- Bootstrap budget, lowest feasible MOQ and fastest lead time
- Three manufacturers being evaluated: Makers Nutrition (Commack NY), NutraScience Labs (Farmingdale NY), Vitalpax (LaVerkin UT)
- Business model: "Batch drop" — production starts after 150 pre-orders

FORMAT YOUR RESPONSE AS A BRIEFING:
- Start with "SOURCING BRIEFING — [Topic] — [Date]"
- Lead with the single most important finding
- 3-5 bullet points with specific data points, prices, or links
- End with "RECOMMENDED ACTION:" — one specific thing Ross should do
- Keep it under 400 words.`;

const SCIENTIST_PROMPT = `You are an autonomous formulation scientist working for Ross, a startup founder building a creatine + magnesium supplement positioned around "freshness" (made-to-order, small batch).

YOUR DAILY TASK: Research the science behind the product. Each day, focus on ONE rotating topic:

MONDAY — Stability science: Search for research on creatine monohydrate stability and degradation. Does it lose potency over time? What about creatinine conversion? Is the "freshness" angle defensible?
TUESDAY — Magnesium deep dive: Search for latest research comparing magnesium forms (glycinate, threonate, citrate). Which has best evidence for sleep, cognition, mood in women?
WEDNESDAY — Dosing optimization: Search for clinical research on creatine dosing for non-athletic populations. What dose produces cognitive and wellness benefits? Can you go below 3g/day?
THURSDAY — Synergy and additions: Search for ingredients that pair well with creatine + magnesium. Vitamin D? B vitamins? What third ingredient strengthens the formula?
FRIDAY — Claims and regulatory: Search for FDA enforcement actions on supplement claims in 2024-2026. What structure/function claims are defensible?
SATURDAY — Women's health angle: Search for research on creatine benefits for women — perimenopause, bone density, cognitive function.
SUNDAY — Competitive formulation analysis: Search for supplement facts panels of top creatine and magnesium products. What forms, doses, excipients are they using?

CONTEXT:
- Formula: Creatine monohydrate (1.5-3g) + magnesium glycinate (200-400mg) in powder format
- Target: Women 30-45, wellness/longevity, not bodybuilding
- Brand angle: "Freshest batch" — manufactured to order
- Powder format: focus on mixability, taste, packaging, and serving size considerations
- Claims must be FDA-compliant structure/function claims

FORMAT:
- Start with "SCIENCE BRIEFING — [Topic] — [Date]"
- Lead with most important finding
- Cite specific studies when possible
- Flag where science doesn't support the marketing angle
- End with "FORMULA RECOMMENDATION:" — one specific suggestion
- Keep under 400 words.`;


async function runAgent(systemPrompt, agentName) {
  const today = new Date();
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()];
  const dateStr = today.toISOString().split('T')[0];

  const userMessage = `Today is ${dayName}, ${dateStr}. Run your daily research task for today's topic. Use web search to find current information. Be specific with findings.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return `[${agentName} ERROR: ANTHROPIC_API_KEY not set]`;
  }

  try {
    console.log(`  ${agentName}: calling API...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
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
      return `[${agentName} ERROR: API ${response.status} — ${errText.slice(0, 500)}]`;
    }

    const data = await response.json();

    let finalText = '';
    for (const block of (data.content || [])) {
      if (block.type === 'text') {
        finalText += block.text;
      }
    }

    console.log(`  ${agentName}: done (${finalText.length} chars, stop_reason: ${data.stop_reason})`);
    return finalText || `[${agentName} completed but returned no text]`;

  } catch (err) {
    return `[${agentName} ERROR: ${err.message}]`;
  }
}


async function sendEmail(to, subject, body) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.log('\nNo RESEND_API_KEY set. Printing briefing to console:\n');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('─'.repeat(50));
    console.log(body);
    console.log('─'.repeat(50));
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
    console.error(`Email send failed: ${response.status} — ${errText}`);
    console.log('\nBriefing content (email failed, logging here):\n');
    console.log(body);
    return;
  }

  console.log('Briefing email sent successfully.');
}


const RESEARCH_AGENT_PROMPT = `You are an autonomous research agent working for Ross, a bootstrap startup founder building a creatine + magnesium supplement brand in powder format, targeting women 30-45 (wellness/longevity positioning, batch-drop business model).

You have been given a specific research request. Use web search to find current, specific information. Be concrete — include prices, brand names, data points, and sources where possible.

FORMAT YOUR RESPONSE AS A BRIEFING:
- Start with "RESEARCH BRIEFING — [Topic] — [Date]"
- Lead with the single most important finding
- 4-6 bullet points with specific data points
- A section flagging where findings affect product or marketing decisions
- End with "RECOMMENDED ACTION:" — one specific next step
- Keep it under 500 words.`;


async function main() {
  const dateStr = new Date().toISOString().split('T')[0];
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  console.log(`\nDaily Agent Briefing — ${dayName}, ${dateStr}\n`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY secret is not set.');
    console.error('Go to repo Settings > Secrets > Actions > add ANTHROPIC_API_KEY');
    process.exit(1);
  }

  console.log('Starting agents...\n');

  const researchRequest = process.env.RESEARCH_REQUEST;
  const agentPromises = [
    runAgent(SOURCING_PROMPT, 'Sourcing Agent'),
    runAgent(SCIENTIST_PROMPT, 'Formulation Scientist'),
  ];
  if (researchRequest) {
    const prompt = `${RESEARCH_AGENT_PROMPT}\n\nRESEARCH REQUEST: ${researchRequest}`;
    agentPromises.push(runAgent(prompt, 'Research Agent'));
  }

  const [sourcingBrief, scientistBrief, researchBrief] = await Promise.all(agentPromises);

  console.log('\n── Sourcing Agent ──');
  console.log(sourcingBrief.slice(0, 300) + '...\n');
  console.log('── Scientist Agent ──');
  console.log(scientistBrief.slice(0, 300) + '...\n');
  if (researchBrief) {
    console.log('── Research Agent ──');
    console.log(researchBrief.slice(0, 300) + '...\n');
  }

  const emailParts = [
    '━'.repeat(40),
    `DAILY AGENT BRIEFING — ${dayName}, ${dateStr}`,
    '━'.repeat(40),
    '',
    sourcingBrief,
    '',
    '─'.repeat(40),
    '',
    scientistBrief,
  ];
  if (researchBrief) {
    emailParts.push('', '─'.repeat(40), '', researchBrief);
  }
  emailParts.push('', '━'.repeat(40), 'Generated by your sourcing and science agents.', '━'.repeat(40));
  const emailBody = emailParts.join('\n');

  // Append to master briefings file
  const masterFile = 'BRIEFINGS.md';
  const entryParts = [
    '',
    `## ${dayName}, ${dateStr}`,
    '',
    '### Sourcing',
    '',
    sourcingBrief,
    '',
    '### Science',
    '',
    scientistBrief,
  ];
  if (researchBrief) {
    entryParts.push('', '### Research Request', '', researchBrief);
  }
  entryParts.push('', '---');
  const entry = entryParts.join('\n');

  if (!existsSync(masterFile)) {
    writeFileSync(masterFile, '# Supplement Agent Briefings\n');
  }
  appendFileSync(masterFile, entry);
  console.log(`Briefing appended to ${masterFile}.`);

  const subject = `Agent Briefing — ${dayName} ${dateStr}`;
  const recipient = process.env.ROSS_EMAIL || 'ross.asdo@gmail.com';

  await sendEmail(recipient, subject, emailBody);

  console.log('\nDone.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
