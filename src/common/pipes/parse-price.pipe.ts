import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParsePricePipe implements PipeTransform<
  string | undefined,
  number | undefined
> {
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
