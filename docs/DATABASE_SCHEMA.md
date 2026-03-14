# BLACKBOX Database Schema

## Core Tables

### profiles
User identity and configuration.

### campaigns
Tracks release campaigns.

Fields:
- id
- user_id
- title
- release_date
- goals
- status
- created_at
- updated_at

### assets
Tracks uploaded campaign assets.

Fields:
- id
- campaign_id
- user_id
- type
- name
- url
- metadata
- created_at

### content_pieces
Stores generated AI outputs.

Fields:
- id
- campaign_id
- user_id
- type
- content
- status
- version
- created_at
- approved_at

### campaign_tasks
Tracks campaign execution tasks.

Fields:
- id
- campaign_id
- user_id
- title
- description
- due_date
- status
- order_index
- created_at
- completed_at
