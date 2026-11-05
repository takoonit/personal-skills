---
type: regex
pattern: '\bas\s+[A-Z]'
target:
  source: file
  path: src/order.ts
match: not_contains
---
