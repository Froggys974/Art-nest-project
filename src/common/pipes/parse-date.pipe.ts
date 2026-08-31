import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, string> {
  /**
   * Validates and parses an ISO date string in YYYY-MM-DD format.
   * @param value - The date string to validate
   * @returns The validated date string
   * @throws {BadRequestException} If the value is not a valid ISO date
   */
  transform(value: string): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(
        `'${String(value)}' is not a valid ISO date (expected YYYY-MM-DD)`,
      );
    }

    const parsed = new Date(`${value}T00:00:00Z`);
    const isRealDate =
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value;

    if (!isRealDate) {
      throw new BadRequestException(`'${value}' is not an existing date`);
    }

    return value;
  }
}
