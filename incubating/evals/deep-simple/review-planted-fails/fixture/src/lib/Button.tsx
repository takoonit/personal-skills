import type { ReactNode } from 'react'
export function Button(props: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return <button type="button" disabled={props.disabled} onClick={props.onClick}>{props.children}</button>
}
