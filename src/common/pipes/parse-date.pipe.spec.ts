import { BadRequestException } from '@nestjs/common';
import { ParseDatePipe } from './parse-date.pipe';

describe('ParseDatePipe', () => {
  const pipe = new ParseDatePipe();

  it('accepts a valid ISO date', () => {
    expect(pipe.transform('2026-07-10')).toBe('2026-07-10');
  });

  it.each(['10/07/2026', '2026-7-10', 'not-a-date', ''])(
    "rejects malformed input '%s'",
    (input) => {
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
    },
  );

  it('rejects an impossible date', () => {
    expect(() => pipe.transform('2026-02-31')).toThrow(BadRequestException);
  });
});
