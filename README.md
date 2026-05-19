# Ticker Research

Ticker research with parallel web search and LLM synthesis. Built for the CascadiaJS 2026 workshop on Render Workflows.

## What it does

Enter a ticker or any research question. The app runs four Exa web searches in parallel, then asks Claude to write a structured research memo from the results. Version 1 is intentionally flaky: each search has a 30% random failure rate so the workshop can show what breaks before adding Render Workflows.

## Deploy on Render

This app is meant to run on [Render](https://render.com/). Local setup is optional (see [Developing](#developing) below).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ojusave/workshop-demo)

1. Click **Deploy to Render** (or apply the [`render.yaml`](render.yaml) Blueprint from the repo).
2. In the Dashboard, set environment variables:

| Variable | Required in v1 |
|----------|----------------|
| `ANTHROPIC_API_KEY` | Yes |
| `EXA_API_KEY` | Yes |
| `RENDER_API_KEY` | Reserved for v2 |

3. Wait for the deploy to finish. Open your service URL (for example `https://ticker-research.onrender.com`).
4. Enter a query and run a research pass. Most v1 runs fail on purpose; that is expected until v2.

Health check: `GET /healthz` returns `ok`.

## Architecture

![Architecture diagram](static/images/architecture-diagram.png)

![Pipeline flow](static/images/pipeline-flow.png)

TODO: add `static/images/architecture-diagram.png` and `static/images/pipeline-flow.png`.

## The failure is intentional

`tasks/src/search.ts` throws on roughly 30% of calls with a fake rate-limit error. Four parallel searches via `Promise.all` in `tasks/src/research.ts` means most v1 runs fail when any single search throws. That is the workshop teaching moment. Version 2 wraps the same task files in Render Workflows with retries.

## Project structure

| Path | Purpose |
|------|---------|
| `server/src/` | Express API and SSE stream |
| `tasks/src/` | Search, synthesis, and orchestration (becomes Workflow tasks in v2) |
| `ui/src/` | React UI |
| `shared/types.ts` | Shared event and data types |

## Developing

Use this only if you are changing code before deploy: workshop prep, or contributing.

```bash
git clone https://github.com/ojusave/workshop-demo.git
cd workshop-demo
npm install
cp .env.example .env   # ANTHROPIC_API_KEY and EXA_API_KEY
npm run dev
```

UI: `http://localhost:5173` (proxies `/api` to the server on port 3000).

## Not investment advice

Generated memos are for demonstration only. They are not financial advice.

---

[Sign up on Render](https://dashboard.render.com/register?utm_source=github&utm_medium=referral&utm_campaign=ojus_demos&utm_content=footer_link)
