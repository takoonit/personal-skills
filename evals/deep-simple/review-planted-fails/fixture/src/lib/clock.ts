export interface Clock { now(): Date }
export const systemClock: Clock = { now: () => new Date() }

/** Claims can be filed until the 5th of the following month. */
export function isClaimWindowOpen(serviceDate: Date, clock: Clock = systemClock): boolean {
  const deadline = new Date(serviceDate.getFullYear(), serviceDate.getMonth() + 1, 5, 23, 59, 59)
  return clock.now() <= deadline
}
