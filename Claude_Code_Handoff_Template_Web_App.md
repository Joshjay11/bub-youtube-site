# Claude Code Handoff: BUB YouTube Script System Web App

## What This Is

A paid web app ($79 one-time) that delivers the BUB YouTube Script System as an interactive tool. Not a static document. Not a Notion template. A real app with calculators that calculate, scorecards that score, databases that filter, and AI prompts that run in-app.

**Lives at:** `youtube.bubwriter.com/app` (same Vercel project as the marketing site)
**Auth:** Stripe Checkout → access granted
**Stack:** Next.js 16 + React + Tailwind + Supabase (auth + database) + Stripe + Anthropic API (Claude-in-Claude for AI prompts)

---

## Why Next.js Instead of Static HTML

The marketing site (youtube.bubwriter.com) is currently a single static HTML file. The app needs:
- Server-side API routes (Stripe webhooks, Anthropic API proxy)
- Database persistence (Supabase for user data)
- Auth (Supabase auth gated by Stripe payment)
- Dynamic rendering (calculators, scorecards, filtered databases)

**Migration plan:** Convert the existing static HTML marketing site into the Next.js project's public pages. The app lives behind auth at `/app`. Marketing pages (`/`, `/process`, `/pricing`, `/work`, `/template`, `/start`) are public.

---

## Project Structure

```
bub-youtube-site/
├── app/
│   ├── layout.tsx                    # Root layout with fonts + theme
│   ├── page.tsx                      # Home (marketing)
│   ├── process/page.tsx              # Process (marketing)
│   ├── pricing/page.tsx              # Pricing (marketing)
│   ├── work/page.tsx                 # Work (marketing)
│   ├── template/page.tsx             # Template sales page (marketing)
│   ├── start/page.tsx                # Intake form (marketing)
│   ├── app/                          # PROTECTED - requires payment
│   │   ├── layout.tsx                # App shell with sidebar nav
│   │   ├── page.tsx                  # Dashboard / home
│   │   ├── idea-validator/
│   │   │   ├── page.tsx              # Idea Scorecard + Viewer Belief Map
│   │   ├── research/
│   │   │   ├── page.tsx              # All Module 1 tools
│   │   ├── structure/
│   │   │   ├── page.tsx              # Beat maps, templates, hooks, pivot guide
│   │   ├── ai-prompts/
│   │   │   ├── page.tsx              # AI prompts with in-app execution
│   │   ├── write/
│   │   │   ├── page.tsx              # Pacing calculator + Script Draft Canvas
│   │   ├── optimize/
│   │   │   ├── page.tsx              # Audit, retention prediction, failure modes
│   │   ├── workflow/
│   │   │   ├── page.tsx              # Fast path + deep-dive guides
│   │   ├── reference/
│   │   │   ├── hooks/page.tsx        # 50 Hooks database (filterable)
│   │   │   ├── calendar/page.tsx     # Content calendar
│   │   │   ├── tracker/page.tsx      # Title performance tracker
│   │   ├── projects/
│   │   │   ├── page.tsx              # List of all video projects
│   │   │   ├── [id]/page.tsx         # Single project with all modules filled
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts     # Create Stripe checkout session
│   │   │   ├── webhook/route.ts      # Handle Stripe webhook (grant access)
│   │   ├── ai/
│   │   │   ├── run-prompt/route.ts   # Proxy to Anthropic API
│   │   ├── auth/
│   │   │   ├── callback/route.ts     # Supabase auth callback
├── components/
│   ├── marketing/                    # Marketing page components
│   ├── app/                          # App components
│   │   ├── Sidebar.tsx
│   │   ├── IdeaScorecard.tsx
│   │   ├── ViewerBeliefMap.tsx
│   │   ├── PacingCalculator.tsx
│   │   ├── ScriptCanvas.tsx
│   │   ├── HookScorecard.tsx
│   │   ├── SatisfactionChecklist.tsx
│   │   ├── AIOutputScorecard.tsx
│   │   ├── ScriptAudit.tsx
│   │   ├── RetentionPrediction.tsx
│   │   ├── HookLibrary.tsx
│   │   ├── PerformanceTracker.tsx
│   │   ├── ContentCalendar.tsx
│   │   ├── PromptRunner.tsx          # Claude-in-Claude component
├── lib/
│   ├── supabase.ts                   # Supabase client
│   ├── stripe.ts                     # Stripe helpers
│   ├── anthropic.ts                  # Anthropic API helpers
│   ├── prompts.ts                    # All AI prompt templates
│   ├── hooks-data.ts                 # 50 hooks database (static JSON)
│   ├── scoring.ts                    # Scorecard calculation logic
├── public/
│   ├── fonts/
├── supabase/
│   ├── migrations/                   # Database schema
├── .env.local                        # API keys
├── tailwind.config.ts
├── next.config.ts
├── package.json
```

---

## Design System

Carry forward the marketing site's aesthetic. This is NOT a generic SaaS dashboard.

**Fonts:**
- Headlines: Playfair Display (serif)
- Body: Manrope (sans)
- Code/prompts: JetBrains Mono

**Colors (CSS variables):**
```css
--bg: #08090c;
--bg-elevated: #0f1117;
--bg-card: #141720;
--bg-card-hover: #1a1e2a;
--amber: #d4a342;
--amber-bright: #eab543;
--amber-dim: #9a7530;
--amber-glow: rgba(212, 163, 66, 0.08);
--amber-glow-strong: rgba(212, 163, 66, 0.15);
--text: #c8ccd4;
--text-bright: #e8eaf0;
--text-dim: #7a8194;
--text-muted: #4a5168;
--border: #1e2233;
--border-light: #2a3048;
--red: #ef4444;
--green: #22c55e;
```

**App Shell:**
- Left sidebar (collapsible) with module navigation
- Main content area
- Dark theme only (matches marketing site)
- Subtle grain overlay preserved

---

## Database Schema (Supabase)

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  has_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### projects (one per video)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'researching', 'scripting', 'filming', 'editing', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### idea_scores
```sql
CREATE TABLE idea_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  curiosity INT CHECK (curiosity BETWEEN 1 AND 5),
  audience_relevance INT CHECK (audience_relevance BETWEEN 1 AND 5),
  novelty INT CHECK (novelty BETWEEN 1 AND 5),
  proof_available INT CHECK (proof_available BETWEEN 1 AND 5),
  emotional_tension INT CHECK (emotional_tension BETWEEN 1 AND 5),
  title_potential INT CHECK (title_potential BETWEEN 1 AND 5),
  thumbnail_potential INT CHECK (thumbnail_potential BETWEEN 1 AND 5),
  satisfaction_potential INT CHECK (satisfaction_potential BETWEEN 1 AND 5),
  production_feasibility INT CHECK (production_feasibility BETWEEN 1 AND 5),
  total_score INT GENERATED ALWAYS AS (
    curiosity + audience_relevance + novelty + proof_available + 
    emotional_tension + title_potential + thumbnail_potential + 
    satisfaction_potential + production_feasibility
  ) STORED,
  verdict TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN curiosity + audience_relevance + novelty + proof_available + 
           emotional_tension + title_potential + thumbnail_potential + 
           satisfaction_potential + production_feasibility >= 40 THEN 'GO'
      WHEN curiosity + audience_relevance + novelty + proof_available + 
           emotional_tension + title_potential + thumbnail_potential + 
           satisfaction_potential + production_feasibility >= 30 THEN 'HOLD'
      ELSE 'KILL'
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### viewer_belief_maps
```sql
CREATE TABLE viewer_belief_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  current_belief TEXT,
  skepticism TEXT,
  fear TEXT,
  hope TEXT,
  change_trigger TEXT,
  target_belief TEXT,
  target_emotion TEXT,
  target_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### scripts
```sql
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  target_minutes INT DEFAULT 12,
  speaking_pace TEXT DEFAULT 'conversational' CHECK (speaking_pace IN ('conversational', 'energetic', 'tutorial')),
  hook TEXT DEFAULT '',
  context_bridge TEXT DEFAULT '',
  micro_act_1 TEXT DEFAULT '',
  pivot TEXT DEFAULT '',
  micro_act_2 TEXT DEFAULT '',
  escalation TEXT DEFAULT '',
  grand_payoff TEXT DEFAULT '',
  session_hook TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### hook_scores
```sql
CREATE TABLE hook_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  opens_mid_action BOOLEAN DEFAULT FALSE,
  specific_gap BOOLEAN DEFAULT FALSE,
  contains_detail BOOLEAN DEFAULT FALSE,
  keeps_promise BOOLEAN DEFAULT FALSE,
  excludes_wrong_audience BOOLEAN DEFAULT FALSE,
  no_i_or_so_start BOOLEAN DEFAULT FALSE,
  creates_stakes BOOLEAN DEFAULT FALSE,
  under_90_words BOOLEAN DEFAULT FALSE,
  matches_title_thumb BOOLEAN DEFAULT FALSE,
  would_stop_scrolling BOOLEAN DEFAULT FALSE,
  total_score INT GENERATED ALWAYS AS (
    (opens_mid_action::int + specific_gap::int + contains_detail::int + 
     keeps_promise::int + excludes_wrong_audience::int + no_i_or_so_start::int + 
     creates_stakes::int + under_90_words::int + matches_title_thumb::int + 
     would_stop_scrolling::int)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### retention_predictions
```sql
CREATE TABLE retention_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  predicted_drop_1_time TEXT,
  predicted_drop_1_reason TEXT,
  predicted_drop_2_time TEXT,
  predicted_drop_2_reason TEXT,
  predicted_drop_3_time TEXT,
  predicted_drop_3_reason TEXT,
  actual_drop_1_time TEXT,
  actual_drop_1_detail TEXT,
  actual_drop_2_time TEXT,
  actual_drop_2_detail TEXT,
  actual_drop_3_time TEXT,
  actual_drop_3_detail TEXT,
  overall_retention DECIMAL,
  prediction_accuracy TEXT CHECK (prediction_accuracy IN ('matched', 'close', 'wrong')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### performance_tracking
```sql
CREATE TABLE performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  publish_date DATE,
  title_formula TEXT,
  hook_formula TEXT,
  hook_score INT,
  ctr_7day DECIMAL,
  avg_retention DECIMAL,
  views_28day INT,
  satisfaction_score INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### content_calendar
```sql
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  publish_date DATE,
  status TEXT DEFAULT 'idea',
  content_pillar TEXT,
  video_type TEXT,
  target_audience TEXT,
  idea_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Stripe Integration

### Flow
1. User clicks "Get the Template - $79" on the marketing site
2. Frontend calls `/api/stripe/checkout` which creates a Stripe Checkout Session
3. User pays on Stripe's hosted page
4. Stripe sends webhook to `/api/stripe/webhook`
5. Webhook creates user in Supabase (if new) or updates `has_access = TRUE`
6. User is redirected to `/app` and can log in via email magic link (Supabase Auth)

### Environment Variables
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...          # $79 one-time price
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Webhook Handler (route.ts)
```typescript
// /api/stripe/webhook/route.ts
// Listen for checkout.session.completed
// Extract customer_email from session
// Upsert user in Supabase with has_access = true
// Return 200
```

---

## Anthropic API Integration (Claude-in-Claude)

### How It Works
The AI Prompts module has a "Run with AI" button next to each prompt. When clicked:
1. The user's filled-in variables (topic, audience, angle, etc.) are injected into the prompt template
2. Frontend calls `/api/ai/run-prompt`
3. Server-side route calls Anthropic API with claude-sonnet-4-20250514
4. Response streams back to the frontend
5. Output displayed in a styled panel below the prompt
6. User can copy, edit, or re-run with modifications

### API Route
```typescript
// /api/ai/run-prompt/route.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  const { prompt, user_id } = await req.json();
  
  // Verify user has access (check Supabase)
  // Rate limit: 20 prompts per day per user
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  
  return Response.json({ 
    output: response.content[0].text 
  });
}
```

### Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Rate Limiting
20 AI prompt runs per day per user. Display remaining count in the UI. This keeps API costs manageable at scale.

### Cost Estimate
- Average prompt: ~1,500 input tokens + ~1,500 output tokens
- Claude Sonnet cost: ~$0.015 per prompt run
- At 20 runs/day max: $0.30/day max per user
- Break-even on AI costs alone: ~260 prompt runs per user ($79 / $0.30 per day is ~263 days of max usage — effectively no cost concern)

---

## Key Interactive Components

### IdeaScorecard.tsx
- 9 sliders (1-5 each) with labels and descriptions
- Real-time total score calculation
- Animated verdict badge: GO (green pulse) / HOLD (amber) / KILL (red)
- Save to project
- History view: all scored ideas with sort by score

### PacingCalculator.tsx
- Dropdown: target video length (5, 8, 10, 12, 13, 15 minutes)
- Dropdown: speaking pace (Tutorial 120 / Conversational 140 / Energetic 160)
- Auto-calculated table showing word count per section
- Updates the Script Canvas targets when saved

### ScriptCanvas.tsx
- 8 expandable text areas (one per script section)
- Live word count per section (colored: green = on target, amber = over/under by 10%, red = over/under by 25%+)
- Total word count and estimated duration
- Each section header shows the structural job reminder
- Toggle to reveal a reference example (from the Bad/Better/Best content)
- Auto-save every 5 seconds

### PromptRunner.tsx
- Prompt template displayed with highlighted {{variables}}
- User fills in variables via input fields
- "Run with AI" button
- Streaming response display
- "Copy Output" button
- "Run Again" button (tweaks the prompt)
- Shows remaining daily runs

### HookLibrary.tsx (Reference: 50 Hooks)
- Card grid or table view
- Filters: hook type (6 options), niche (10 options), channel size (3 brackets)
- Search by keyword
- Each card shows: hook text, score badge, type tag, niche tag
- Expandable: why it works, what you'd change, steal-this-structure template
- Static data loaded from hooks-data.ts (no database needed — this is reference content)

### ScriptAudit.tsx
- All checklist items as checkboxes
- MUST PASS items highlighted with red border until checked
- Auto-calculated score: X/10 MUST PASS, Y/25 total
- Visual: progress bar showing completion
- Verdict: "Ready to record" / "Fix MUST PASS items first" / "Major revision needed"

### RetentionPrediction.tsx
- 3 prediction slots (timestamp + reason)
- After publishing: 3 actual slots (timestamp + detail)
- Side-by-side comparison view
- Accuracy self-assessment radio buttons
- History across projects showing prediction accuracy trend

---

## Content Pages (Static Reference)

These pages are read-only educational content rendered from the template v2 markdown. No interactivity needed beyond navigation.

- **The 35% Pivot Explained** (Section 2D) — full text with 8 examples
- **Bad / Better / Best Hook Examples** (Section 2F) — 18 examples across 6 types
- **15 Retention Failure Modes** (Section 5C) — full text with before/after fixes
- **Structure Templates** (Section 2C) — 5 video type templates
- **Video Type Decision Tree** (Section 2A) — interactive flowchart or static guide
- **What This Template Can and Can't Do** (Section 6C) — honest diagnostic table

---

## Auth Flow

1. **New user:** Clicks "Get the Template" → Stripe Checkout → Payment → Webhook creates Supabase user with has_access=true → Redirect to `/app` → Email magic link login
2. **Returning user:** Goes to `/app` → Email magic link login → Access granted if has_access=true
3. **Non-paying user:** Goes to `/app` → Redirect to `/template` (sales page)

---

## Deployment

- **Platform:** Vercel
- **Database:** Supabase (free tier handles hundreds of users)
- **Repo:** Same GitHub repo as current site (JoshJay11/bub-youtube-site), but restructured as Next.js project
- **Environment variables set in Vercel:**
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - STRIPE_PRICE_ID
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - ANTHROPIC_API_KEY

---

## Build Order

### Phase 1: Foundation
1. Init Next.js 16 project with Tailwind
2. Set up Supabase project + run migrations
3. Set up Stripe product ($79 one-time) + webhook
4. Build auth flow (Stripe → Supabase → magic link)
5. Build app shell (sidebar, layout, routing)
6. Port marketing pages from static HTML into Next.js pages

### Phase 2: Core Interactive Tools
7. IdeaScorecard component + database integration
8. ViewerBeliefMap component
9. PacingCalculator component
10. ScriptCanvas component with live word counts
11. HookScorecard component
12. ScriptAudit component with MUST PASS logic

### Phase 3: AI Integration
13. Anthropic API route with rate limiting
14. PromptRunner component with streaming
15. Wire all 8 prompts (3A through 3H) with variable injection

### Phase 4: Reference Content + Tracking
16. 50 Hooks database page (static data, filterable UI)
17. Content Calendar (CRUD against Supabase)
18. Performance Tracker (CRUD against Supabase)
19. RetentionPrediction component
20. All static content pages (Pivot guide, failure modes, examples, etc.)

### Phase 5: Polish
21. Onboarding flow for new users (guided tour of modules)
22. Project management (create/list/switch between video projects)
23. Mobile responsive pass
24. Upgrade triggers placed in appropriate locations
25. Final design QA

---

## Content Source File

All written content (explanations, examples, failure modes, templates, workflow guides) lives in:

`/mnt/user-data/outputs/BUB_YouTube_Script_System_Template_v2.md`

This is the single source of truth for all text content in the app. The 50 hooks data will be added as a separate JSON file once the research pipeline produces it.

---

## Cost Structure

| Item | Monthly Cost |
|------|-------------|
| Vercel (Hobby) | $0 |
| Supabase (Free tier) | $0 |
| Stripe | 2.9% + $0.30 per transaction |
| Anthropic API (20 runs/day/user, ~100 active users) | ~$45/month |
| Custom domain (already owned) | $0 |
| **Total at 100 active users** | **~$45/month** |
| **Revenue at 100 sales** | **$7,900** |

Margin is excellent. API costs are the only variable, and they're capped by rate limiting.

---

*Handoff complete. This document + the Template v2 markdown contain everything needed to build the app.*
