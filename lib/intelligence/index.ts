// lib/intelligence/index.ts
// Main exports for BLACKBOX intelligence layer
// Design: BLACKBOX_V1_INTELLIGENCE_LAYER_DESIGN.md
// Expanded: 2026-01-02 - Complete dashboard intelligence

export { 
  generateDashboardIntelligence, 
  generateCurrentRead,
  type DashboardIntelligence,
  type InterpretationResult,
  type PriorityTask,
  type TaskGuide
} from './interpret'

export { 
  getCachedInterpretation, 
  cacheDashboardIntelligence,
  cacheInterpretation,
  generateProfileHash,
  type CachedInterpretation
} from './cache'

export { validateCurrentRead } from './validate'
