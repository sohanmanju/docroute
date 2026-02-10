# DocRoute

Smart LLM routing comparison platform. Routes documents through three parallel pipelines (auto-routed, frontier, budget) and compares cost, latency, and quality side by side.

## What it does

Upload a document or image, pick a feature (invoice processing, contract analysis, meeting notes, image analysis), and DocRoute runs three pipelines in parallel:

- **Auto Router** - picks the optimal model per step (budget for extraction, frontier for reasoning)
- **All Frontier** - uses the most capable model for every step
- **All Budget** - uses the cheapest model for every step

Each pipeline runs a 3-step sequential process. Results are compared on cost, latency, and quality.

## Quality Evaluation

After all three pipelines complete, a blind LLM-as-judge evaluates output quality:

- Outputs are shuffled and labeled Response A/B/C (the judge never sees which mode produced which output)
- GPT-4o scores each output independently on accuracy, completeness, and formatting (1-5 scale)
- For image tasks, consensus ground truth is built from step 0 extractions across all three modes

## Features

- Invoice line item extraction, expense categorization, anomaly flagging
- Contract key term extraction, plain-English summary, risky clause detection
- Meeting note structuring, action item extraction, follow-up email drafting
- Image description, SEO alt-text generation, brand fit analysis
- Real-time reactive UI with per-step progress tracking
- Cost breakdown with per-step model attribution

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: Convex (real-time database + serverless functions)
- **LLM Routing**: OpenRouter API (Claude Sonnet 4, DeepSeek Chat, Gemini Flash, auto routing)
- **Quality Judge**: GPT-4o via OpenRouter

## Setup

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=<your convex deployment url>
CONVEX_DEPLOYMENT=<your convex deployment name>
```

Set `OPENROUTER_API_KEY` as an environment variable in your Convex dashboard.

```bash
npx convex dev   # start Convex dev server
npm run dev      # start Next.js dev server
```

## Project Structure

```
app/              # Next.js App Router pages
components/       # React components (ui, layout, comparison, dashboard, upload)
convex/           # Convex backend (schema, queries, mutations, actions)
  pipeline.ts     # LLM pipeline execution
  judge.ts        # Blind quality evaluation
  tasks.ts        # Task CRUD and dashboard stats
  schema.ts       # Database schema
lib/              # Shared utilities (router config, pipeline definitions)
```
