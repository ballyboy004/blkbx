# BLACKBOX System Map

## Product Structure

BLACKBOX is one shared platform with individually releasable modules.

It must be built as:

- shared platform core
- shared intelligence core
- module access system
- individually shippable modules

## Shared Platform Core

These belong to the platform layer, not to any single module:

- auth
- user profiles
- subscription state
- module access control
- intelligence memory
- behavioral pattern tracking
- shared database utilities
- shared types
- shared UI primitives

## Intelligence Core

The Intelligence Core is always-on and shared across the whole system.

It stores:

- user context
- behavioral patterns
- performance history
- strategic memory
- campaign outcomes
- future cross-module insights

Important:
This is NOT a standalone module.
It is a system layer used by all modules.

## Current Module Plan

### Module 1: Campaign
Purpose:
Generate and support release campaigns.

Core responsibilities:
- create campaign
- generate strategy
- generate press release
- generate email draft
- generate first-wave captions
- generate campaign tasks
- support approval workflow
- track progress

### Module 2: Content
Purpose:
Generate and manage release content.

Future responsibilities:
- platform-specific captions
- content calendar
- performance-aware generation
- campaign-linked content outputs

### Module 3: Network
Purpose:
Manage outreach and relationship workflows.

Future responsibilities:
- contact tracking
- outreach drafting
- campaign-linked outreach
- relationship memory

### Module 4: Brand
Purpose:
Maintain identity, tone, and aesthetic consistency.

Future responsibilities:
- voice guidance
- aesthetic guidance
- brand consistency across outputs

### Module 5: Analytics
Purpose:
Provide user-facing performance visibility and recommendations.

Future responsibilities:
- campaign outcome reporting
- content performance
- audience signals
- strategic recommendations

## Canonical Objects

All modules should work around shared system objects.

Core objects:

- Profile
- Campaign
- Asset
- ContentPiece
- CampaignTask
- Contact
- Insight
- BehaviorPattern
- OutcomeRecord

Example:
Campaign creates a Campaign object.
Generated strategy is stored as a ContentPiece.
Tasks are stored as CampaignTasks.
Future outreach links back to Campaign.

## V1 Boundaries

V1 is Campaign only.

V1 includes:
- onboarding/context capture
- campaign creation
- strategy generation
- press release generation
- email generation
- caption generation
- campaign task generation
- approval/review flow
- progress tracking

V1 does NOT include:
- auto-posting
- outreach automation
- advanced analytics
- cross-platform integrations
- full autonomous execution

## Engineering Rules

- one codebase
- modular architecture
- no hard dependency on future modules
- new code should follow platform vs module separation
- keep Campaign logic separate from shared platform logic
- preserve ability to toggle modules on/off by subscription
- avoid large refactors unless necessary for V1

## Primary Goal Right Now

Ship BLACKBOX Campaign V1 fast, while preserving the architecture needed for future modules.
