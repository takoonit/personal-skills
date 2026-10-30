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
tags: [ship-sound-code, files, typescript]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Orders can now be refunded. Add a refunded status that records when it happened and how much, and make describeOrder handle it.
