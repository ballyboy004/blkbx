# BLACKBOX Engineering Context

BLACKBOX is a modular AI-powered platform for independent artist career infrastructure.

## Architecture Principles

- One shared platform
- Shared Intelligence Core
- Individually releasable modules
- Modules enabled/disabled via subscription tiers

## Platform Layers

### Intelligence Core
Stores:
- user context
- behavioral patterns
- strategic memory
- performance data

### Execution Layer
Responsible for generating outputs:
- campaign strategies
- captions
- press releases
- email drafts
- future outreach automation

### Modules

Modules are independent but share the same core.

Modules planned:

- Campaign
- Content
- Network
- Brand
- Analytics

Campaign is the **first module shipping in V1**.

## Stack

- Next.js 14
- Supabase (auth + database)
- Claude API
- Stripe (later)

## V1 Scope

Campaign module must support:

- campaign creation
- strategy generation
- press release generation
- email draft generation
- caption generation
- campaign task list
- approval workflow
- progress tracking

Do NOT implement yet:

- automated posting
- outreach automation
- analytics dashboards
- multi-platform integrations
