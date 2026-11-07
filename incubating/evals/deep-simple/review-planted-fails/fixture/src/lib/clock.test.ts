import { isClaimWindowOpen, Clock } from './clock'
const fixed = (iso: string): Clock => ({ now: () => new Date(iso) })
console.assert(isClaimWindowOpen(new Date('2026-10-20'), fixed('2026-11-04T10:00:00')))
console.assert(!isClaimWindowOpen(new Date('2026-10-20'), fixed('2026-11-06T10:00:00')))
