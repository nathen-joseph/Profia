# StockSight AI

## Overview

An AI-powered stock investment analyzer that checks profit/loss possibilities and success rates for any stock ticker. Users can search for stocks, get detailed AI analysis, and manage a watchlist.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (dark Bloomberg-terminal theme)
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations

## Features

- **Stock Analysis** — Enter any ticker for AI-powered profit/loss scenarios and success rate
- **Success Rate Gauge** — Animated gauge showing probability of profitable outcome
- **Scenarios** — Bull/bear case with percent change and detailed descriptions
- **Key Factors** — Tagged chips showing bullish/bearish drivers
- **Recommendation** — Buy/Hold/Sell badge with color coding
- **Dashboard** — Aggregate stats, popular stocks, recent analyses feed
- **Watchlist** — Save stocks for quick re-analysis
- **Search** — Debounced ticker autocomplete

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

- `artifacts/stock-analyzer/` — React + Vite frontend
- `artifacts/api-server/` — Express 5 backend with AI routes
- `lib/db/` — Drizzle ORM schema (analyses, watchlist tables)
- `lib/api-spec/openapi.yaml` — OpenAPI contract
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/integrations-openai-ai-server/` — OpenAI client wrapper

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI proxy base URL (auto-provisioned)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (auto-provisioned)
- `SESSION_SECRET` — Session secret
