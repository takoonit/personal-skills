declare function deleteEmployeePermanently(id: string): Promise<void>
export function DeleteEmployeeButton({ employeeId, name }: { employeeId: string; name: string }) {
  async function onClick() {
    if (window.confirm(`Permanently delete ${name}? This removes all records and cannot be undone.`)) {
      await deleteEmployeePermanently(employeeId)
    }
  }
  return <button type="button" className="danger" onClick={onClick}>Delete permanently</button>
}
