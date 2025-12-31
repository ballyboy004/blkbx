import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

export function createClient() {
  const cookieStore = cookies() as any;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Next.js returns an array of cookies with { name, value, ... }
          return cookieStore.getAll?.() ?? [];
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Next.js cookieStore types don't exactly match Supabase CookieOptions.
              // This cast keeps runtime behavior correct while satisfying TS.
              cookieStore.set?.(name, value, options as any);
            });
          } catch {
            // Safe to ignore — happens during RSC rendering
          }
        },
      },
    }
  );
}
