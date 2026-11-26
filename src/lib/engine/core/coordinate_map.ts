/**
 * Core coordinate projection and price-to-screen conversion math.
 */

export function priceToScreenY(
  price: number,
  initialPrice: number,
  logScale: number,
  screenH: number,
): number {
  const centerY = screenH / 2;
  if (price <= 0 || initialPrice <= 0) return centerY;
  const logRatio = Math.log(price / initialPrice);
  return centerY - logRatio * logScale;
}

export function candleIndexToScreenX(
  candleIdx: number,
  candleStep: number,
  cameraX: number,
): number {
  return candleIdx * candleStep - cameraX;
}

export function interpolateCandleY(
  y1: number,
  y2: number,
  frac: number,
): number {
  return y1 + (y2 - y1) * frac;
}
