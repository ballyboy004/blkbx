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
  
  // Current State (Panel 4) - NEW
  content_activity: string | null;  // 'regular' | 'sometimes' | 'rarely' | 'never'
  release_status: string | null;    // 'regular' | 'few' | 'unreleased' | 'first'
  stuck_on: string | null;          // Free text - where they feel blocked

  // Legacy field (may be used elsewhere)
  current_state: string | null;

  onboarding_completed: boolean | null;
  onboarding_completed_at: string | null;
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
      "id,email,context,primary_goal,genre_sound,career_stage,strengths,weaknesses,constraints,current_focus,current_state,content_activity,release_status,stuck_on,onboarding_completed,onboarding_completed_at"
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
