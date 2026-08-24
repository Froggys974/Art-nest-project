// The epsilon nudge cancels binary floating-point noise (~1e-13 at these
// magnitudes) without distorting real values, since it's far below half a cent.
export const round2 = (value: number): number =>
  Math.round((value + 1e-8) * 100) / 100;

export const sum = (values: number[]): number =>
  round2(values.reduce((total, value) => total + value, 0));
