import { useState } from 'react'

type Session = { userId: string; name: string; email: string; department: string }
type Line = { id: string; label: string; amount: number }

export function ClaimForm({ session, status }: { session: Session; status: 'DRAFT' | 'PENDING_HRBP_APPROVAL' | 'APPROVED' }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [lines, setLines] = useState<Line[]>([])

  function removeLine(id: string) {
    if (window.confirm('Are you sure you want to remove this line?')) {
      setLines(ls => ls.filter(l => l.id !== id))
    }
  }

  return (
    <form>
      <span className="badge">{status}</span>
      <label>Your name <input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Your email <input value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Department <input value={department} onChange={e => setDepartment(e.target.value)} /></label>
      <ul>
        {lines.map(l => <li key={l.id}>{l.label} {l.amount} <button type="button" onClick={() => removeLine(l.id)}>Remove</button></li>)}
      </ul>
      <button type="submit">Submit claim</button>
    </form>
  )
}
