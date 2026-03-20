'use server'

import { createCampaign as createCampaignImpl } from '@/lib/modules/campaign/actions'
import type { CreateCampaignInput } from '@/lib/modules/campaign/types'

export async function createCampaign(formData: CreateCampaignInput): Promise<{ id: string }> {
  return createCampaignImpl(formData)
}
