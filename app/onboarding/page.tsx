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
      "context, primary_goal, genre_sound, career_stage, strengths, weaknesses, constraints, current_focus, onboarding_completed"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile?.onboarding_completed) redirect("/dashboard");

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
      }}
    />
  );
}