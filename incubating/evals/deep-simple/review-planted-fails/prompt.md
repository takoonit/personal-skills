---
plugins:
  - ../../../skills/deep-simple
  - ../../../skills/deep-simple-setup
tags: [deep-simple, review, files]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---
Review src/ for structural problems before we keep building on it. Report what you find; do not change any code.
