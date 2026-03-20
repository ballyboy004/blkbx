import { redirect } from 'next/navigation'
import { getAuthedUserOrRedirect } from '@/lib/profile/profile'
import { createClient } from '@/lib/supabase/server'
import { getContentPiece, getCampaign } from '@/lib/modules/campaign/queries'
import { AssetReviewScreen } from '@/components/workspace/AssetReviewScreen'

type PageProps = {
  params: Promise<{ id: string; assetId: string }>
}

export default async function AssetReviewPage({ params }: PageProps) {
  const { user } = await getAuthedUserOrRedirect('/')
  if (!user) return null

  const { id, assetId } = await params
  const supabase = await createClient()

  const piece = await getContentPiece(supabase, assetId, user.id)
  if (!piece) redirect(`/campaign/${id}`)

  const campaign = await getCampaign(supabase, id, user.id)
  if (!campaign) redirect('/dashboard')

  return (
    <AssetReviewScreen
      piece={piece}
      campaign={campaign}
      campaignId={id}
    />
  )
}
