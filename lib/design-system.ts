// ============================================================================
// BLACKBOX DESIGN SYSTEM
// ============================================================================
// SINGLE SOURCE OF TRUTH for all visual styling
// Every component imports from here — no exceptions
// To change the look of BLACKBOX, edit THIS FILE ONLY
// ============================================================================

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Page
  page: '#000000',

  // Card backgrounds
  card: {
    transparent: 'rgba(26, 26, 26, 0.45)',
    solid: 'rgba(20, 20, 20, 0.97)',
  },

  // Input backgrounds
  input: {
    default: 'rgba(26, 26, 26, 0.3)',
    focus: 'rgba(26, 26, 26, 0.5)',
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.14)',
    focus: 'rgba(255, 255, 255, 0.2)',
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: '#d4d4d8',   // zinc-300
    muted: '#a1a1aa',       // zinc-400
    faint: '#71717a',       // zinc-500
    disabled: '#52525b',    // zinc-600
  },

  // Semantic
  success: '#10b981',
  error: '#ef4444',

} as const

// ============================================================================
// EFFECTS
// ============================================================================

export const effects = {
  blur: {
    sm: 'blur(8px)',
    md: 'blur(20px)',
    lg: 'blur(28px)',
  },

  saturate: {
    default: 'saturate(170%)',
    high: 'saturate(180%)',
  },

  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.25)',
    md: '0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2)',
    lg: '0 6px 20px rgba(0, 0, 0, 0.4), 0 16px 40px rgba(0, 0, 0, 0.3)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.6), 0 24px 48px rgba(0, 0, 0, 0.5)',
  },

  transition: {
    fast: 'all 100ms ease-out',
    default: 'all 150ms ease-out',
    slow: 'all 300ms ease-out',
  },
} as const

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  card: {
    padding: {
      sm: 'p-4 sm:p-6',
      md: 'p-6 sm:p-8',
      lg: 'p-6 sm:p-8 md:p-10',
    },
    gap: 'space-y-5',
  },

  section: {
    gap: 'space-y-6',
  },

  input: {
    padding: 'px-3 py-2',
    height: 'h-11',
    minHeight: 'min-h-[44px]',  // Touch target
  },

  button: {
    padding: {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4',
    },
    minHeight: 'min-h-[44px]',  // Touch target
  },
} as const

// ============================================================================
// RADII
// ============================================================================

export const radii = {
  sm: '2px',
  default: '4px',
  md: '6px',
  lg: '8px',
} as const

// ============================================================================
// TYPOGRAPHY (Classes)
// ============================================================================

export const typography = {
  // Labels (uppercase, tracked)
  label: 'font-mono text-[12px] font-semibold tracking-[0.2em] uppercase text-zinc-500',

  // Card headers
  cardHeader: 'font-mono text-[13px] font-semibold tracking-[0.2em] uppercase text-zinc-500',

  // Task title
  taskTitle: 'font-inter font-black text-[20px] text-white leading-tight tracking-tight',

  // Body text
  body: 'font-mono text-[14px] font-normal leading-relaxed text-zinc-300',

  // Input text
  input: 'font-mono text-[13px] tracking-normal text-zinc-200',

  // Button text
  button: 'font-mono text-[10px] font-medium tracking-[0.15em] uppercase',

  // Small/meta text
  small: 'font-mono text-[11px] text-zinc-500',

  // Pill text
  pill: 'font-mono text-[11px] tracking-tight',
} as const

// ============================================================================
// COMPONENT STYLES (Style Objects)
// ============================================================================

export const components = {
  // Cards
  card: {
    base: {
      background: colors.card.transparent,
      backdropFilter: `${effects.blur.md} ${effects.saturate.default}`,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radii.default,
      boxShadow: effects.shadow.sm,
    },
    elevated: {
      background: colors.card.transparent,
      backdropFilter: `${effects.blur.lg} ${effects.saturate.high}`,
      border: `1px solid ${colors.border.default}`,
      borderRadius: radii.default,
      boxShadow: effects.shadow.md,
    },
    hero: {
      background: colors.card.transparent,
      backdropFilter: `${effects.blur.lg} ${effects.saturate.high}`,
      border: `1px solid ${colors.border.strong}`,
      borderRadius: radii.default,
      boxShadow: effects.shadow.lg,
    },
  },

  // Overlays (modals, dropdowns) — solid, matches visual tone of frosted cards
  overlay: {
    modal: {
      background: colors.card.solid,
      border: `1px solid ${colors.border.strong}`,
      borderRadius: radii.default,
      boxShadow: effects.shadow.xl,
    },
    dropdown: {
      background: colors.card.solid,
      border: `1px solid ${colors.border.strong}`,
      borderRadius: radii.default,
      boxShadow: effects.shadow.lg,
    },
    backdrop: {
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    },
  },

  // Inputs
  input: {
    default: {
      background: colors.input.default,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radii.default,
      color: colors.text.primary,
    },
    focus: {
      background: colors.input.focus,
      border: `1px solid ${colors.border.focus}`,
      outline: 'none',
    },
  },

  // Buttons
  button: {
    primary: {
      background: 'rgba(39, 39, 42, 0.8)',
      border: `1px solid ${colors.border.default}`,
      borderRadius: radii.sm,
      color: colors.text.primary,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radii.sm,
      color: colors.text.muted,
    },
    ghost: {
      background: 'transparent',
      border: 'none',
      borderRadius: radii.sm,
      color: colors.text.faint,
    },
  },

  // Pills (selectable options)
  pill: {
    active: {
      background: 'rgba(39, 39, 42, 0.6)',
      border: `1px solid ${colors.border.default}`,
      borderRadius: radii.default,
      color: colors.text.primary,
    },
    inactive: {
      background: 'transparent',
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: radii.default,
      color: colors.text.faint,
    },
  },
} as const

// ============================================================================
// CSS CLASS HELPERS
// ============================================================================

// Input class string
export const inputClass = `
  w-full rounded bg-[rgba(26,26,26,0.3)]
  border border-white/[0.06]
  focus:bg-[rgba(26,26,26,0.5)] focus:border-white/[0.2] focus:outline-none
  text-zinc-200 placeholder:text-zinc-600
  ${spacing.input.padding}
  ${typography.input}
  transition-colors
`.replace(/\s+/g, ' ').trim()

// Pill class string
export const pillClass = (active: boolean) =>
  [
    spacing.button.padding.md,
    spacing.button.minHeight,
    'rounded border transition-colors',
    typography.pill,
    active
      ? 'bg-zinc-800/60 border-white/10 text-white'
      : 'bg-transparent border-white/[0.06] text-zinc-600 hover:border-white/10 hover:text-zinc-400',
  ].join(' ')

// Button class strings
export const buttonClass = {
  primary: [
    spacing.button.padding.sm,
    spacing.button.minHeight,
    'bg-zinc-800/80 border border-white/10 rounded-sm',
    'text-white',
    typography.button,
    'hover:bg-zinc-700/80 hover:border-white/15',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-colors',
  ].join(' '),

  secondary: [
    spacing.button.padding.sm,
    spacing.button.minHeight,
    'bg-transparent border border-white/[0.06] rounded-sm',
    'text-zinc-500',
    typography.button,
    'hover:border-white/10 hover:text-zinc-400',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-colors',
  ].join(' '),

  ghost: [
    spacing.button.padding.sm,
    spacing.button.minHeight,
    'bg-transparent border-none rounded-sm',
    'text-zinc-600',
    typography.button,
    'hover:text-zinc-400',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-colors',
  ].join(' '),
}

// ============================================================================
// LEGACY EXPORTS (for backwards compatibility during migration)
// ============================================================================

export const cardStyles = {
  base: components.card.base,
  medium: components.card.elevated,
  hero: components.card.hero,
  modal: components.overlay.modal,
  dropdown: components.overlay.dropdown,
}
