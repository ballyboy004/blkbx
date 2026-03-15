export type CampaignReleaseType = 'Single' | 'EP' | 'Album' | 'Mixtape'

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'archived'

export type ContentPieceType = 'strategy' | 'press_release' | 'email' | 'captions' | 'announcement'

export type ContentPieceStatus = 'pending' | 'generated' | 'approved' | 'rejected'

export type Campaign = {
  id: string
  user_id: string
  title: string
  release_type: CampaignReleaseType | null
  release_date: string | null
  goals: string | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export type ContentPiece = {
  id: string
  user_id: string
  campaign_id: string
  type: ContentPieceType
  content: string | null
  status: ContentPieceStatus
  version: number
  created_at: string
  approved_at: string | null
}

export type CreateCampaignInput = {
  title: string
  release_type: CampaignReleaseType | ''
  release_date: string
}

export type CampaignStrategyInput = {
  artistContext: string
  genreSound: string
  careerStage: string
  constraints: string
  campaignTitle: string
  releaseType: CampaignReleaseType | null
  releaseDate: string | null
}

export type CampaignStrategy = {
  analysis: string
  strategic_pillars: string[]
  risks: string[]
  opportunities: string[]
  immediate_actions: string[]
}

export type CampaignTaskPhase = 'preparation' | 'launch' | 'post_release'

export type CampaignTaskStatus = 'pending' | 'done' | 'skipped'

export type CampaignTask = {
  id: string
  campaign_id: string
  user_id: string
  title: string
  description: string | null
  status: CampaignTaskStatus
  phase: CampaignTaskPhase
  order_index: number
  due_date: string | null
  created_at: string
  completed_at: string | null
}
