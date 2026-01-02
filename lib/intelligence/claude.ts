// lib/intelligence/claude.ts
// Claude API client with rate limiting
// Design: BLACKBOX_V1_INTELLIGENCE_LAYER_DESIGN.md

import Anthropic from '@anthropic-ai/sdk'

/**
 * Rate limiter configuration
 * - Max 40 requests/minute (buffer under 50/min API limit)
 * - Queue requests if rate exceeded
 */
const RATE_LIMIT = {
  maxRequestsPerMinute: 40,
  windowMs: 60 * 1000, // 1 minute
}

// Simple in-memory rate limiter
class RateLimiter {
  private requests: number[] = []

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    
    // Remove requests outside the current window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < RATE_LIMIT.windowMs
    )

    // If at limit, wait until oldest request expires
    if (this.requests.length >= RATE_LIMIT.maxRequestsPerMinute) {
      const oldestRequest = this.requests[0]
      const waitTime = RATE_LIMIT.windowMs - (now - oldestRequest)
      
      console.log(`[Intelligence] Rate limit reached, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      // Retry after wait
      return this.waitIfNeeded()
    }

    // Record this request
    this.requests.push(now)
  }
}

const rateLimiter = new RateLimiter()

/**
 * Initialize Claude client
 * Requires ANTHROPIC_API_KEY environment variable
 */
function getClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to your .env.local file.'
    )
  }

  return new Anthropic({
    apiKey,
  })
}

/**
 * Generate text using Claude API with rate limiting
 * 
 * @param systemPrompt - The full system prompt (includes profile data)
 * @param options - Optional configuration
 * @returns Generated text and token usage
 */
export async function generateWithClaude(
  systemPrompt: string,
  options: {
    maxTokens?: number
    temperature?: number
  } = {}
): Promise<{
  text: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
}> {
  // Wait for rate limiter
  await rateLimiter.waitIfNeeded()

  const client = getClaudeClient()

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 1.0,
      messages: [
        {
          role: 'user',
          content: systemPrompt,
        },
      ],
    })

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text')
    const text = textContent && textContent.type === 'text' 
      ? textContent.text 
      : ''

    // Extract usage stats
    const usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }

    console.log('[Intelligence] API call successful', {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      textLength: text.length,
    })

    return {
      text,
      usage,
    }
  } catch (error) {
    console.error('[Intelligence] Claude API error:', error)
    throw error
  }
}

/**
 * Calculate cost for a given token usage
 * 
 * Pricing (Sonnet 4):
 * - Input: $3 per 1M tokens
 * - Output: $15 per 1M tokens
 */
export function calculateCost(usage: {
  inputTokens: number
  outputTokens: number
}): number {
  const inputCost = (usage.inputTokens / 1_000_000) * 3
  const outputCost = (usage.outputTokens / 1_000_000) * 15
  return inputCost + outputCost
}
