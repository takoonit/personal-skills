export class PayrollUnavailableError extends Error {
  constructor(readonly employeeId: string, cause: unknown) { super(`Payroll unavailable for ${employeeId}`, { cause }) }
}
declare function callPayroll(employeeId: string): Promise<number>

export async function getMonthlySalary(employeeId: string): Promise<number> {
  try {
    return await callPayroll(employeeId)
  } catch (e) {
    throw new PayrollUnavailableError(employeeId, e)
  }
}
