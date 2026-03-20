# LIVE SCHEMA SOURCE OF TRUTH

This document reflects the current live Supabase schema.
When there is any conflict between docs, prompts, code, or assumptions, this file wins.

---

## campaigns
- id
- user_id
- release_id
- title
- release_date
- goals
- status
- created_at
- updated_at
- release_type

## content_pieces
- id
- campaign_id
- user_id
- type  (values: strategy | press_release | email | captions | announcement)
- content
- status  (values: pending | generated | approved | rejected)
- version
- created_at
- approved_at

## campaign_tasks
- id
- campaign_id
- user_id
- title
- description
- status  (values: pending | done | skipped)
- phase  (values: preparation | launch | post_release)
- order_index
- parent_id  (nullable uuid → campaign_tasks.id — null = milestone, set = sub-task)
- due_date
- created_at
- completed_at
- ai_context  (nullable text — AI-generated execution brief, cached after first generation)
- deliverable_note  (nullable text — optional link or note added after marking done)

## assets
- id
- campaign_id
- user_id
- type
- name
- url
- metadata
- created_at

## profiles
- id
- email
- artist_name
- career_stage
- primary_goal
- genre_sound
- strengths
- constraints
- current_focus
- onboarding_completed
- onboarding_completed_at
- context
- updated_at
- genre
- weaknesses
- release_phase
- current_state
- content_activity
- release_status
- stuck_on
- artist_archetype
- visibility_style
- release_philosophy
- audience_relationship
- reference_artists
- role
- project_status
- readiness_checklist  (jsonb)
- campaign_goals       (jsonb)
- primary_blocker
- subscription_status
- subscription_tier
- stripe_customer_id
- stripe_subscription_id
- modules_enabled
- created_at

## intelligence_context
- id
- user_id
- completion_rate
- skip_patterns
- preferred_task_types
- stream_patterns
- engagement_patterns
- discovery_paths
- content_performance
- geographic_momentum
- voice_patterns
- network_roi
- updated_at

## releases
- id
- user_id
- title
- release_date
- release_type
- goal
- platform_focus
- why_it_matters
- status
- created_at

## tasks
- id
- release_id
- task_name
- phase
- purpose
- due_date
- status
- created_at
- user_id
- kind
- priority
- source
- title
- guardrail
- suggestion
- completed_at
- reasoning
- reflection
- skip_reason

## reflections
- id
- release_id
- achieved_goal
- what_worked
- what_underperformed
- do_differently
- created_at
- user_id
- linked_task_id

---

## Rules
- Do not invent fields not listed here
- Do not rename fields in prompts
- If a task needs a new field, explicitly say DATABASE CHANGES are required
- tasks and campaign_tasks are separate systems
- campaign_tasks.parent_id = null means it is a milestone (top-level)
- campaign_tasks.parent_id = uuid means it is a sub-task under that milestone
- intelligence_context is populated by Module 1 behavioral data, Module 2 analytics data later
