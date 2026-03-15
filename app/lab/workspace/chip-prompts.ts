const CHIP_PROMPTS: Record<string, string> = {
  explain: 'Show me why this is the right move right now. Be brief and visual.',
  rollout: 'Show me the rollout sequence. Phases only, one line each.',
  map: 'Show me the campaign structure. Visual overview, no prose.',
}

export function getChipPrompt(chipId: string): string {
  return CHIP_PROMPTS[chipId] ?? chipId
}
