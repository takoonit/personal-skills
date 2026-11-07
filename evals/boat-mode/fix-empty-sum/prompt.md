---
plugins:
  - ../../../skills/boat-mode
  - ../../../skills/strategic-gate
  - ../../../skills/shark-tank
  - ../../../skills/shape-system-work
  - ../../../skills/doakes
  - ../../../skills/dextor
  - ../../../skills/lundy
  - ../../../skills/design-guide
  - ../../../skills/intentional-design
  - ../../../skills/laws-of-ux
  - ../../../skills/ship-sound-code
  - ../../../skills/clear-tactful-writing
tags: [boat-mode, fix]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, TaskCreate, TaskUpdate]
---
/boat-mode Summing an empty array throws instead of returning 0. Fix it and keep normal sums working.
