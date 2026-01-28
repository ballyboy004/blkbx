# DESIGN SYSTEM — BLACKBOX

## MANDATORY PROCESS

Before ANY visual change:

1. **READ** the target component file completely
2. **EXTRACT** every Tailwind class used for:
   - Typography (font, size, weight, tracking, color)
   - Spacing (padding, margin, gap)
   - Colors (text, background, border)
   - Effects (shadow, blur, opacity)
3. **LIST** the extracted classes in your response
4. **MATCH** those exact patterns for new elements
5. **ASK** if no equivalent pattern exists

DO NOT invent new styles. Copy existing ones.

---

## ANALYSIS CHECKLIST

Before editing, answer these:

- [ ] What font classes does this component use?
- [ ] What text sizes exist? (text-[12px], text-[14px], etc.)
- [ ] What text colors exist? (zinc-100, zinc-300, zinc-500?)
- [ ] What spacing values exist? (p-6, gap-4, space-y-2?)
- [ ] What button styles exist?
- [ ] What hover states exist?

If you cannot answer these from reading the file, do not proceed.

---

## CURRENT PATTERNS (Reference)

### Typography

| Element | Classes | Example |
|---------|---------|---------|
| Card header | `font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500` | TODAY, PROFILE, PATTERNS |
| Section label | `font-mono text-[12px] font-bold tracking-[0.2em] uppercase text-zinc-500` | TASK, WHY, GUARDRAIL, EDGE, FRICTION |
| Body text | `font-mono text-[14px] text-zinc-300 leading-relaxed` | Paragraph content |
| Task title | `font-mono text-white font-medium` | Main task name |
| Button text | `font-mono text-[11px] font-medium tracking-wider uppercase` | SKIP, DONE, EDIT |

### Colors

| Purpose | Class |
|---------|-------|
| Primary text | `text-white` or `text-zinc-100` |
| Body text | `text-zinc-300` |
| Labels/muted | `text-zinc-500` |
| Borders | `border-zinc-700` or `border-white/10` |
| Card bg | `bg-zinc-900/40` with backdrop-blur |

### Cards

```
bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-lg p-6
```

### Buttons

**Bordered (SKIP, DONE, EDIT):**
```
border border-zinc-700 bg-transparent px-4 py-2
font-mono text-[11px] font-medium tracking-wider uppercase text-zinc-300
hover:bg-zinc-800 hover:text-white transition-colors
```

**Text-only (HISTORY):**
```
text-zinc-500 hover:text-zinc-300 
font-mono text-[11px] tracking-wider uppercase
no border, no background
```

### Hover/Interactions

- Color shift only: `hover:text-zinc-300` or `hover:bg-zinc-800`
- Transition: `transition-colors`
- NO underlines
- NO scale/transform
- NO inset shadows
- NO pressed effects

### Spacing

- Card padding: `p-6`
- Between cards: `gap-6`
- Label to content: `mt-2` or `space-y-2`
- Between sections inside card: `space-y-4` or `space-y-6`

---

## HIERARCHY

| Level | Card | Visual Weight |
|-------|------|---------------|
| 1 (Hero) | TODAY | Full width, top, most content |
| 2 (Primary) | CURRENT READ | Full width, prominent |
| 3 (Secondary) | PROFILE, PATTERNS | Side by side, equal |
| 4 (Tertiary) | CONTEXT NOTES, NEXT ACTIONS | Collapsed, minimal |

---

## ADDING NEW ELEMENTS

**New button?** Copy exact classes from existing DONE or SKIP button.

**New label?** Copy exact classes from TASK or WHY label.

**New text?** Copy exact classes from body text in same component.

**New card?** Copy exact structure from PROFILE or PATTERNS card.

**Unsure?** Stop and ask.

---

## FORBIDDEN

- New font families
- Colors outside zinc palette
- Underlines on interactive elements
- Transform/scale on hover
- Box shadows on buttons
- Gradients (except existing card glow)
- Emojis
- Bright accent colors

---

## VALIDATION

After making changes, verify:

- [ ] New elements use only classes that existed before
- [ ] No new colors introduced
- [ ] No new font sizes introduced
- [ ] Hover states match existing pattern
- [ ] Spacing is consistent with siblings
