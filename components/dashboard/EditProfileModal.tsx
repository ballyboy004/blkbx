'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateProfile, type ProfileUpdateData } from '@/app/dashboard/actions/profile'
import { components, typography, inputClass, pillClass, buttonClass, spacing } from '@/lib/design-system'

type CareerStage = 'early' | 'building' | 'momentum' | 'breakout' | 'pro'
type ContentActivity = 'regular' | 'sometimes' | 'rarely' | 'never'
type ReleaseStatus = 'regular' | 'few' | 'unreleased' | 'first'

type EditProfileModalProps = {
  profile: {
    context: string | null
    primary_goal: string | null
    genre_sound: string | null
    career_stage: string | null
    strengths: string | null
    weaknesses: string | null
    constraints: string | null
    current_focus: string | null
    content_activity: string | null
    release_status: string | null
    stuck_on: string | null
  }
}

export default function EditProfileModal({ profile }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Form state
  const [context, setContext] = useState(profile.context || '')
  const [primaryGoal, setPrimaryGoal] = useState(profile.primary_goal || '')
  const [genreSound, setGenreSound] = useState(profile.genre_sound || '')
  const [careerStage, setCareerStage] = useState<CareerStage>(
    (profile.career_stage as CareerStage) || 'building'
  )
  const [strengths, setStrengths] = useState(profile.strengths || '')
  const [weaknesses, setWeaknesses] = useState(profile.weaknesses || '')
  const [constraints, setConstraints] = useState(profile.constraints || '')
  const [currentFocus, setCurrentFocus] = useState(profile.current_focus || '')
  
  // NEW fields
  const [contentActivity, setContentActivity] = useState<ContentActivity>(
    (profile.content_activity as ContentActivity) || 'sometimes'
  )
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus>(
    (profile.release_status as ReleaseStatus) || 'few'
  )
  const [stuckOn, setStuckOn] = useState(profile.stuck_on || '')

  function handleOpen() {
    setContext(profile.context || '')
    setPrimaryGoal(profile.primary_goal || '')
    setGenreSound(profile.genre_sound || '')
    setCareerStage((profile.career_stage as CareerStage) || 'building')
    setStrengths(profile.strengths || '')
    setWeaknesses(profile.weaknesses || '')
    setConstraints(profile.constraints || '')
    setCurrentFocus(profile.current_focus || '')
    setContentActivity((profile.content_activity as ContentActivity) || 'sometimes')
    setReleaseStatus((profile.release_status as ReleaseStatus) || 'few')
    setStuckOn(profile.stuck_on || '')
    setIsOpen(true)
  }

  async function handleSave() {
    if (isSaving) return
    setIsSaving(true)

    const data: ProfileUpdateData = {
      context,
      primary_goal: primaryGoal,
      genre_sound: genreSound,
      career_stage: careerStage,
      strengths,
      weaknesses,
      constraints,
      current_focus: currentFocus,
      content_activity: contentActivity,
      release_status: releaseStatus,
      stuck_on: stuckOn,
    }

    try {
      const result = await updateProfile(data)

      if (result.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        console.error('[Edit Profile] Failed:', result.error)
        alert('Failed to save profile. Please try again.')
      }
    } catch (error) {
      console.error('[Edit Profile] Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="btn-recess bg-transparent border border-white/30 rounded-sm font-mono font-medium uppercase text-white text-[9px] px-3 py-2 tracking-[0.12em] min-h-[44px]"
      >
        Edit
      </button>

      {/* Modal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => !isSaving && setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/95" />

          {/* Modal content */}
          <div
            style={components.overlay.modal}
            className="relative w-full max-w-2xl mx-4 sm:mx-0 my-4 sm:my-8 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0">
              <h2 className="font-mono text-[14px] font-semibold tracking-[0.15em] uppercase text-white">
                Edit Profile
              </h2>
              <button
                onClick={() => !isSaving && setIsOpen(false)}
                disabled={isSaving}
                className="btn-recess text-zinc-500 disabled:opacity-50 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Context */}
              <FieldBlock label="Context (Who You Are)">
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="I'm a recording artist focused on..."
                  className={`${inputClass} min-h-[100px] resize-none`}
                />
              </FieldBlock>

              {/* Primary Goal */}
              <FieldBlock label="Primary Goal (Next 90 Days)">
                <textarea
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  placeholder='Ex: "consistent releases" / "grow tiktok discovery"'
                  className={`${inputClass} min-h-[80px] resize-none`}
                />
              </FieldBlock>

              {/* Genre/Sound */}
              <FieldBlock label="Genre / Sound">
                <input
                  type="text"
                  value={genreSound}
                  onChange={(e) => setGenreSound(e.target.value)}
                  placeholder='Ex: "dark r&b"'
                  className={`${inputClass} ${spacing.input.height}`}
                />
              </FieldBlock>

              {/* Career Stage */}
              <FieldBlock label="Career Stage">
                <div className="flex flex-wrap gap-2">
                  {(['early', 'building', 'momentum', 'breakout', 'pro'] as CareerStage[]).map((stage) => (
                    <PillButton
                      key={stage}
                      active={careerStage === stage}
                      onClick={() => setCareerStage(stage)}
                    >
                      {stage}
                    </PillButton>
                  ))}
                </div>
              </FieldBlock>

              {/* NEW: Content Activity */}
              <FieldBlock label="Content Activity">
                <div className="flex flex-wrap gap-2">
                  <PillButton active={contentActivity === 'regular'} onClick={() => setContentActivity('regular')}>
                    i post regularly (3+/week)
                  </PillButton>
                  <PillButton active={contentActivity === 'sometimes'} onClick={() => setContentActivity('sometimes')}>
                    i post sometimes
                  </PillButton>
                  <PillButton active={contentActivity === 'rarely'} onClick={() => setContentActivity('rarely')}>
                    i rarely post
                  </PillButton>
                  <PillButton active={contentActivity === 'never'} onClick={() => setContentActivity('never')}>
                    i don't post yet
                  </PillButton>
                </div>
              </FieldBlock>

              {/* NEW: Release Status */}
              <FieldBlock label="Release Status">
                <div className="flex flex-wrap gap-2">
                  <PillButton active={releaseStatus === 'regular'} onClick={() => setReleaseStatus('regular')}>
                    i release regularly
                  </PillButton>
                  <PillButton active={releaseStatus === 'few'} onClick={() => setReleaseStatus('few')}>
                    i've released a few things
                  </PillButton>
                  <PillButton active={releaseStatus === 'unreleased'} onClick={() => setReleaseStatus('unreleased')}>
                    i have unreleased music
                  </PillButton>
                  <PillButton active={releaseStatus === 'first'} onClick={() => setReleaseStatus('first')}>
                    working on first release
                  </PillButton>
                </div>
              </FieldBlock>

              {/* NEW: Where Stuck */}
              <FieldBlock label="Where Do You Feel Stuck?">
                <textarea
                  value={stuckOn}
                  onChange={(e) => setStuckOn(e.target.value)}
                  placeholder='Ex: "I make content but never post it" / "I post but get no engagement"'
                  className={`${inputClass} min-h-[80px] resize-none`}
                />
              </FieldBlock>

              {/* Strengths */}
              <FieldBlock label="Strengths">
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder='Ex: "making music consistently, visuals, moody branding"'
                  className={`${inputClass} min-h-[80px] resize-none`}
                />
              </FieldBlock>

              {/* Weaknesses */}
              <FieldBlock label="Growth Areas">
                <textarea
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  placeholder='Ex: "posting consistency, outreach, overthinking"'
                  className={`${inputClass} min-h-[80px] resize-none`}
                />
              </FieldBlock>

              {/* Constraints */}
              <FieldBlock label="Constraints">
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder='Ex: "2 hours/day, low budget, I burn out if I post daily"'
                  className={`${inputClass} min-h-[80px] resize-none`}
                />
              </FieldBlock>

              {/* Current Focus */}
              <FieldBlock label="Current Focus (Next 30 Days)">
                <input
                  type="text"
                  value={currentFocus}
                  onChange={(e) => setCurrentFocus(e.target.value)}
                  placeholder='Ex: "release idea 001 + build tiktok discovery"'
                  className={`${inputClass} ${spacing.input.height}`}
                />
              </FieldBlock>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 sm:p-6 border-t border-zinc-800 flex-shrink-0">
              <button
                onClick={() => !isSaving && setIsOpen(false)}
                disabled={isSaving}
                className={`flex-1 ${buttonClass.secondary}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 ${buttonClass.primary}`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className={typography.label}>{label}</label>
      {children}
    </div>
  )
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={pillClass(active)}>
      {children}
    </button>
  )
}
