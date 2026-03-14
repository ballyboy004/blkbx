import { getAuthedUserOrRedirect } from '@/lib/profile/profile'
import { Logo } from '@/components/ui/Logo'
import { CampaignForm } from '@/components/campaign/CampaignForm'
import { components, typography } from '@/lib/design-system'

export default async function CampaignNewPage() {
  const { user } = await getAuthedUserOrRedirect('/')
  if (!user) return null

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(30, 40, 60, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(40, 30, 50, 0.5) 0%, transparent 50%),
          #0a0a0a
        `,
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(30,30,30,0.2) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at center, rgba(40,40,40,0.1) 0%, transparent 60%)',
            boxShadow: 'inset 0 0 150px 80px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen px-4 sm:px-6 md:px-10 py-8 sm:py-12">
        <div className="max-w-[560px] mx-auto">
          <header className="mb-8">
            <Logo size="md" href="/dashboard" />
            <p className="text-xs uppercase tracking-[0.2em] font-mono text-zinc-500 mt-2">
              New campaign
            </p>
          </header>

          <div
            className="p-6 sm:p-8 rounded-lg"
            style={components.card.elevated}
          >
            <h1 className={`${typography.cardHeader} mb-6`}>Create campaign</h1>
            <CampaignForm />
          </div>
        </div>
      </div>
    </div>
  )
}
