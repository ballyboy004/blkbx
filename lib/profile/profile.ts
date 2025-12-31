import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;

  // onboarding fields
  context: string | null;
  primary_goal: string | null;
  genre_sound: string | null;
  career_stage: string | null;

  strengths: string | null;
  weaknesses: string | null;
  constraints: string | null;
  current_focus: string | null;

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
    // Server Components: throw redirect
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
      "id,email,context,primary_goal,genre_sound,career_stage,strengths,weaknesses,constraints,current_focus,onboarding_completed,onboarding_completed_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function requireOnboardingCompleteOrRedirect(userId: string) {
  const profile = await getProfileByUserId(userId);

  const { redirect } = await import("next/navigation");

  // If profile row doesn't exist yet OR onboarding isn't complete, force onboarding
  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return profile;
}