/**
 * Cost estimate from token counts. Pure, so it can be tested without a database.
 * Rates are in rupiah per one million tokens. Stored values are in micro-rupiah
 * (1 rupiah = 1,000,000 micro), so integers stay exact.
 */
export function estimateCostMicros(tokens: number, ratePerMtokIdr: number): number {
  if (!Number.isFinite(tokens) || tokens <= 0 || !Number.isFinite(ratePerMtokIdr) || ratePerMtokIdr <= 0) return 0;
  return Math.round(tokens * ratePerMtokIdr);
}

export function microsToRupiah(micros: number): number {
  return Math.round((micros / 1_000_000) * 100) / 100;
}

export function isTimeout(message: string): boolean {
  return /timed out/i.test(message);
}
