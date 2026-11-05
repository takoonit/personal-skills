#!/usr/bin/env bash
set -euo pipefail
cat > Checkout.tsx <<'TSX'
export function Checkout({ total }: { total: number }) {
  return (
    <form>
      <input name="email" placeholder="Email" />
      <input name="card" placeholder="Card number" />
      <button type="button">Save for later</button>
      <button type="submit">Pay {total}</button>
    </form>
  );
}
TSX
