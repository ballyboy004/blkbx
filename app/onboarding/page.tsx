import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./ONboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "context, primary_goal, genre_sound, career_stage, strengths, weaknesses, constraints, current_focus, content_activity, release_status, stuck_on, artist_archetype, visibility_style, release_philosophy, audience_relationship, reference_artists, onboarding_completed, role, project_status, readiness_checklist, campaign_goals, primary_blocker"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile?.onboarding_completed) redirect("/dashboard");

  const parseList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return v ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : []
      }
    }
    return []
  }

  return (
    <OnboardingClient
      userId={user.id}
      userEmail={user.email ?? ""}
      initialProfile={{
        context: profile?.context ?? "",
        primary_goal: profile?.primary_goal ?? "",
        genre_sound: profile?.genre_sound ?? "",
        career_stage: (profile?.career_stage as any) ?? "building",
        strengths: profile?.strengths ?? "",
        weaknesses: profile?.weaknesses ?? "",
        constraints: profile?.constraints ?? "",
        current_focus: profile?.current_focus ?? "",
        content_activity: (profile?.content_activity as any) ?? "sometimes",
        release_status: (profile?.release_status as any) ?? "few",
        stuck_on: profile?.stuck_on ?? "",
        artist_archetype: profile?.artist_archetype ?? "",
        visibility_style: profile?.visibility_style ?? "",
        release_philosophy: profile?.release_philosophy ?? "",
        audience_relationship: profile?.audience_relationship ?? "",
        reference_artists: profile?.reference_artists ?? "",
        role: profile?.role ?? "",
        project_status: profile?.project_status ?? "",
        readiness_checklist: parseList(profile?.readiness_checklist),
        campaign_goals: parseList(profile?.campaign_goals),
        primary_blocker: profile?.primary_blocker ?? "",
      }}
    />
  );
}
