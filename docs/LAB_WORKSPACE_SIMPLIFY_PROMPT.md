# CURSOR PROMPT: Simplify /lab/workspace — Mission First, Depth on Request

Use this prompt in Cursor to implement or refine the simplified BLACKBOX lab workspace.

---

## Context

The mission card is the true north star of the interface. The secondary cards (Strategy, Tasks, Analysis) should not appear as equal-weight parallel surfaces; they are deeper layers of the same mission and must be progressively disclosed.

## Scope

- **Only** modify `/app/lab/workspace` and any components used exclusively by that route.
- **Do not** change backend logic, `lib/modules`, database schema, `/app/dashboard`, or `/app/campaign`.

## Goal

The workspace should prioritize **one primary object**: the Mission Card. Everything else is progressively disclosed.

## Required Changes

1. **Keep the mission card** as the dominant primary surface (unchanged in role and prominence).

2. **Remove** the always-visible, equal-weight secondary cards (the three-card grid: Strategy, Tasks, Analysis).

3. **Replace** them with a **single expandable section** beneath the mission card. That section contains:
   - **Strategy**
   - **Task Map** (label; previously “Tasks”)
   - **Analysis**

4. **Interaction:** Each item is a row that **expands inline** when opened (accordion-style). Only one section open at a time is recommended for “depth only when requested.”

5. **Keep** the AI command bar at the bottom, unchanged in position and role.

6. **Target feel:**
   - Mission first.
   - Depth only when requested.

## Design Notes

- The expandable section should feel secondary: darker glass, lower visual weight, same max-width as the mission card (or slightly constrained) so it reads as one “depth” panel, not three separate cards.
- Use a chevron or caret to indicate expand/collapse; animate height and opacity for open/close.
- Preserve existing atmosphere, mission card styling, and command bar styling unless you are explicitly refining them in another pass.

## Do Not

- Add new routes or navigation.
- Change backend, schema, or production routes.
- Introduce orbit/node UI or new metaphors.
- Make the depth section compete visually with the mission card.

## Success Criteria

- On load: only the mission card and the command bar dominate; the depth section is a single, secondary control below the mission card.
- User can open Strategy, Task Map, or Analysis from that section; content expands inline.
- The interface clearly communicates: mission first, depth on request.
