-- Add artist identity / career model fields to profiles
-- Migration: 20260315_add_profile_identity_fields

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS artist_archetype text,
  ADD COLUMN IF NOT EXISTS visibility_style text,
  ADD COLUMN IF NOT EXISTS release_philosophy text,
  ADD COLUMN IF NOT EXISTS audience_relationship text,
  ADD COLUMN IF NOT EXISTS reference_artists text;

COMMENT ON COLUMN public.profiles.artist_archetype IS 'Career identity model: cult artist, mainstream crossover, underground tastemaker, etc.';
COMMENT ON COLUMN public.profiles.visibility_style IS 'How the artist wants to be seen: scarce/mysterious, consistent/present, community-driven, etc.';
COMMENT ON COLUMN public.profiles.release_philosophy IS 'How they approach releases: slow/intentional, frequent/iterative, event-driven, etc.';
COMMENT ON COLUMN public.profiles.audience_relationship IS 'How they relate to fans: distant/aspirational, close/personal, anonymous/music-first, etc.';
COMMENT ON COLUMN public.profiles.reference_artists IS 'Career models they are inspired by (freetext, 1-3 artists).';
