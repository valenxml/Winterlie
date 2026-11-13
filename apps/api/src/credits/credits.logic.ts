/**
 * Pure credit rules. Kept free of database code so they can be tested directly.
 * All amounts are whole credits. Time-based rules use Western Indonesia Time (UTC+7).
 */

export const SIGNUP_BONUS = 5;
export const DAILY_GRANT = 1;
export const GENERATE_COST = 1;
export const REGENERATE_COST = 1;

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** The calendar day in WIB, as YYYY-MM-DD. Used to make the daily grant once per day. */
export function dailyKey(now: Date): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Balance is the sum of all ledger entries. Nothing is stored as a running total. */
export function sumBalance(amounts: number[]): number {
  return amounts.reduce((total, a) => total + a, 0);
}

export function canAfford(balance: number, cost: number): boolean {
  return balance >= cost;
}
