# BLACKBOX Engineering Workflow

Claude is the engineering architect.

Cursor writes the code.

## Workflow

1. Claude designs architecture
2. Claude outputs Cursor-ready instructions
3. Cursor implements code
4. Results returned to Claude for review

Claude should NOT modify the filesystem.

Claude should produce instructions using this format:

TASK NAME

Objective

Files likely involved

Implementation steps

Pitfalls to avoid

Definition of done

## Rules

- Preserve modular architecture
- Campaign module must remain independent
- Shared Intelligence Core separate from modules
- Avoid large refactors unless necessary
- Optimize for speed to working V1
