import { round2, sum } from './money';

describe('round2', () => {
  it('rounds a value that is already 2dp-clean', () => {
    expect(round2(1234.5)).toBe(1234.5);
  });

  it('does not lose a cent to floating-point noise on a .5 boundary', () => {
    // 5000.90 * 0.35 is mathematically 1750.315, but the naive
    // Math.round(value * 100) / 100 loses the boundary cent to binary
    // floating-point representation and returns 1750.31.
    expect(round2(5000.9 * 0.35)).toBe(1750.32);
  });

  it('still rounds down correctly below the half-cent boundary', () => {
    expect(round2(1750.314)).toBe(1750.31);
  });

  it('still rounds up correctly above the half-cent boundary', () => {
    expect(round2(1750.316)).toBe(1750.32);
  });
});

describe('sum', () => {
  it('rounds the total of several values', () => {
    expect(sum([1000.005, 2000.005])).toBe(3000.01);
  });

  it('returns 0 for an empty list', () => {
    expect(sum([])).toBe(0);
  });
});
