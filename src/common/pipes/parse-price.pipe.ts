import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParsePricePipe implements PipeTransform<
  string | undefined,
  number | undefined
> {
  /**
   * Validates and parses a price string, allowing optional whitespace and comma/period decimal separators.
   * @param value - The price string to parse (or undefined)
   * @returns The parsed price as a number rounded to 2 decimal places, or undefined
   * @throws {BadRequestException} If the value is not a valid price or is less than or equal to 0
   */
  transform(value: string | undefined): number | undefined {
    if (value === undefined) {
      return undefined;
    }
    const raw = String(value).replace(/\s/g, '').replace(',', '.');

    if (raw === '' || !/^\d+(\.\d+)?$/.test(raw)) {
      throw new BadRequestException(`'${String(value)}' is not a valid price`);
    }

    const price = Math.round(parseFloat(raw) * 100) / 100;

    if (price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    return price;
  }
}
