---
type: regex
pattern: '\|\|\s*true'
target:
  source: file
  path: .github/workflows/ci.yml
match: not_contains
---
