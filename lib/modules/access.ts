/**
 * Module Access System
 * 
 * Controls which modules a user can access based on subscription.
 * During V1 development, Campaign module is enabled for all users.
 */

import type { Profile } from '@/lib/profile/profile'

export type ModuleId = 'campaign' | 'content' | 'network' | 'brand' | 'analytics'

/**
 * Check if a user has access to a specific module.
 * 
 * During V1 dev: Campaign is always enabled.
 * In production: Checks modules_enabled array from subscription.
 */
export function hasModuleAccess(profile: Profile | null, moduleId: ModuleId): boolean {
  if (!profile) return false
  
  // V1 Dev Mode: Campaign is always enabled
  if (moduleId === 'campaign') return true
  
  // Future modules check the modules_enabled array
  return profile.modules_enabled?.includes(moduleId) ?? false
}

/**
 * Get all enabled modules for a user.
 */
export function getEnabledModules(profile: Profile | null): ModuleId[] {
  if (!profile) return []
  
  // Always include campaign during V1
  const modules: ModuleId[] = ['campaign']
  
  // Add any additional enabled modules
  if (profile.modules_enabled) {
    for (const mod of profile.modules_enabled) {
      if (!modules.includes(mod as ModuleId)) {
        modules.push(mod as ModuleId)
      }
    }
  }
  
  return modules
}

/**
 * Check if user has an active subscription.
 */
export function hasActiveSubscription(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.subscription_status === 'active'
}

/**
 * Get subscription tier name.
 */
export function getSubscriptionTier(profile: Profile | null): string | null {
  return profile?.subscription_tier ?? null
}
