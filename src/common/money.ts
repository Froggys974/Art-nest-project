export const round2 = (value: number): number =>
  Math.round((value + 1e-8) * 100) / 100;

export const sum = (values: number[]): number =>
  round2(values.reduce((total, value) => total + value, 0));
