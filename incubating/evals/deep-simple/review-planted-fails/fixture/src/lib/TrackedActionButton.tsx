import type { ReactNode } from 'react'
import { Button } from './Button'

type Permission = 'claims.approve' | 'claims.export'
declare function can(p: Permission): boolean
declare function track(event: string): void

/** Renders only when the user has the permission and records the action. */
export function ActionButton({ permission, event, onClick, children }: { permission: Permission; event: string; onClick: () => void; children: ReactNode }) {
  if (!can(permission)) return null
  return <Button onClick={() => { track(event); onClick() }}>{children}</Button>
}
