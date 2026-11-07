#!/usr/bin/env bash
set -euo pipefail
cp -R "$(dirname "$0")/fixture/." .
git init -q && git remote add origin https://dev.azure.com/acme/hr/_git/hr-portal
git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm baseline
