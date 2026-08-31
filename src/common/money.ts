/**
 * Rounds a number to 2 decimal places with a small epsilon to handle floating point errors.
 * @param value - The number to round
 * @returns The number rounded to 2 decimal places
 */
export const round2 = (value: number): number =>
  Math.round((value + 1e-8) * 100) / 100;

/**
 * Sums an array of numbers and rounds the result to 2 decimal places.
 * @param values - Array of numbers to sum
 * @returns The sum rounded to 2 decimal places
 */
export const sum = (values: number[]): number =>
  round2(values.reduce((total, value) => total + value, 0));
