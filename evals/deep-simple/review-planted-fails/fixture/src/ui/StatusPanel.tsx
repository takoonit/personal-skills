import type { ReactNode } from 'react'

export function StatusPanel(props: { isLoading: boolean; isError: boolean; isEmpty: boolean; errorMessage: string; children: ReactNode }) {
  if (props.isLoading) return <p>Loading...</p>
  if (props.isError) return <p role="alert">{props.errorMessage}</p>
  if (props.isEmpty) return <p>No data</p>
  return <>{props.children}</>
}
