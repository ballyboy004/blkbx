// app/api/test-rls/route.ts
// RLS TEST ENDPOINT - temporary, for verification only
// DELETE THIS FILE after RLS is verified working

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ 
      error: 'Not authenticated',
      rls_working: 'unknown' 
    }, { status: 401 })
  }

  // Test 1: Get own profile (should work)
  const { data: ownProfile, error: ownError } = await supabase
    .from('profiles')
    .select('id, email, context')
    .eq('id', user.id)
    .single()

  // Test 2: Try to get ALL profiles (RLS should filter to only own)
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('id, email, context')

  // Test 3: Try to get ALL tasks (RLS should filter to only own)
  const { data: allTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, user_id, task_name')

  // Test 4: Count total users (service role bypasses RLS, this won't work here)
  // We can't get total user count with ANON key - that's correct behavior

  const rlsWorking = 
    ownProfile !== null &&           // Can read own profile
    allProfiles?.length === 1 &&     // Can only see own profile
    allProfiles[0].id === user.id    // That profile is yours

  return NextResponse.json({
    rls_working: rlsWorking,
    current_user_id: user.id,
    current_user_email: user.email,
    tests: {
      own_profile: {
        success: !ownError,
        data: ownProfile ? { id: ownProfile.id, email: ownProfile.email } : null
      },
      all_profiles_query: {
        count: allProfiles?.length || 0,
        explanation: 'Should be 1 (only your profile)',
        data: allProfiles?.map(p => ({ id: p.id, email: p.email }))
      },
      all_tasks_query: {
        count: allTasks?.length || 0,
        explanation: 'Should only be your tasks',
        user_ids: [...new Set(allTasks?.map(t => t.user_id) || [])]
      }
    },
    verdict: rlsWorking 
      ? '✅ RLS IS WORKING - You can only see your own data'
      : '❌ RLS MAY NOT BE WORKING - Check the data above'
  })
}
