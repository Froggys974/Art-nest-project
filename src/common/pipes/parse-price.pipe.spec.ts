import { BadRequestException } from '@nestjs/common';
import { ParsePricePipe } from './parse-price.pipe';

describe('ParsePricePipe', () => {
  const pipe = new ParsePricePipe();

  it.each([
    ['5000', 5000],
    ['5000.50', 5000.5],
    ['5 000,50', 5000.5],
    ['19999.999', 20000],
  ])("parses '%s' to %d", (input, expected) => {
    expect(pipe.transform(input)).toBe(expected);
  });

  it.each(['abc', '', '-50', '5.000,50'])(
    "rejects invalid price '%s'",
    (input) => {
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
    },
  );

  it('rejects zero', () => {
    expect(() => pipe.transform('0')).toThrow(BadRequestException);
  });

  it('passes through undefined for optional query params', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });
});
