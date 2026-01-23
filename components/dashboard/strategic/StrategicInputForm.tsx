'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type StrategicInputFormProps = {
  strategicQuestion: string
  onTaskGenerated: (task: StrategicTask) => void
  onError: (error: string) => void
}

type StrategicTask = {
  title: string
  reasoning: string
  guardrail: string
  guide: {
    what: string
    how: string[]
    why: string
  }
}

export default function StrategicInputForm({
  strategicQuestion,
  onTaskGenerated,
  onError
}: StrategicInputFormProps) {
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    if (!input.trim() || isGenerating) return

    setIsGenerating(true)

    try {
      const response = await fetch('/api/intelligence/strategic-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategicInput: input.trim(),
          strategicQuestion: strategicQuestion
        })
      })

      const data = await response.json()

      if (data.success) {
        onTaskGenerated(data.task)
      } else {
        onError(data.error || 'Failed to generate task')
      }
    } catch (error) {
      console.error('[Strategic Input] Error:', error)
      onError('Network error - please try again')
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = input.trim().length > 10 && !isGenerating

  return (
    <div className="space-y-5">
      {/* Strategic Question */}
      <div className="space-y-3">
        <div className="font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500">
          STRATEGIC QUESTION
        </div>
        <p className="font-mono text-[14px] font-normal leading-[1.7] text-zinc-300">
          {strategicQuestion}
        </p>
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <div className="font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500">
          YOUR APPROACH
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I want to show my technical side but keep it mysterious - like glimpses of my setup but never revealing everything..."
          className="w-full min-h-[100px] bg-zinc-900/30 border border-zinc-700/50 rounded-sm text-zinc-300 placeholder:text-zinc-600 font-mono text-[13px] leading-[1.6] p-4 focus:outline-none focus:border-zinc-600/50 focus:bg-zinc-900/40 resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800/30 hover:text-white hover:border-zinc-600 transition-colors font-mono font-medium uppercase tracking-[0.1em] text-[11px] px-6 py-2 h-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'GENERATING...' : 'GENERATE TASK'}
        </Button>
      </div>

      {/* Input guidance */}
      {input.trim().length > 0 && input.trim().length < 10 && (
        <p className="text-[10px] font-mono text-zinc-600 lowercase">
          tell us more about your approach...
        </p>
      )}
    </div>
  )
}

export type { StrategicTask }