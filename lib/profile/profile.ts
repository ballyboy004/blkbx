import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;

  // Context (Panel 1)
  context: string | null;
  
  // Direction (Panel 2)
  primary_goal: string | null;
  genre_sound: string | null;
  career_stage: string | null;

  // Patterns (Panel 3)
  strengths: string | null;
  weaknesses: string | null;
  constraints: string | null;
  current_focus: string | null;
  
  // Current State (Panel 4)
  content_activity: string | null;
  release_status: string | null;
  stuck_on: string | null;

  // Identity / Career Model (Decision 2)
  artist_archetype: string | null;
  visibility_style: string | null;
  release_philosophy: string | null;
  audience_relationship: string | null;
  reference_artists: string | null;

  // Legacy field
  current_state: string | null;

  // Onboarding
  onboarding_completed: boolean | null;
  onboarding_completed_at: string | null;

  // Module Access (V1 Campaign)
  subscription_status: 'free' | 'active' | 'cancelled' | 'past_due' | null;
  subscription_tier: string | null;
  stripe_customer_id: string | null;
  modules_enabled: string[] | null;

  // Onboarding (adaptive flow)
  role: string | null;
  project_status: string | null;
  readiness_checklist: string[] | null;
  campaign_goals: string[] | null;
  primary_blocker: string | null;
};

export async function getAuthedUserOrRedirect(redirectTo: string = "/") {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const { redirect } = await import("next/navigation");
    redirect(redirectTo);
  }

  return { supabase, user };
}

export async function getProfileByUserId(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,email,context,primary_goal,genre_sound,career_stage,strengths,weaknesses,constraints,current_focus,current_state,content_activity,release_status,stuck_on,artist_archetype,visibility_style,release_philosophy,audience_relationship,reference_artists,onboarding_completed,onboarding_completed_at,subscription_status,subscription_tier,stripe_customer_id,modules_enabled,role,project_status,readiness_checklist,campaign_goals,primary_blocker"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function requireOnboardingCompleteOrRedirect(userId: string) {
  const profile = await getProfileByUserId(userId);

  const { redirect } = await import("next/navigation");

  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return profile;
}
