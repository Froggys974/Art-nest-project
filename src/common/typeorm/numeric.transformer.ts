import { ValueTransformer } from 'typeorm';

export class NumericTransformer implements ValueTransformer {
  /**
   * Transforms a numeric value to the database format (no transformation needed).
   * @param value - The numeric value to store
   * @returns The value as-is
   */
  to(value: number | null | undefined): number | null | undefined {
    return value;
  }

  /**
   * Transforms a database string value to a JavaScript number.
   * @param value - The string value from the database
   * @returns The parsed number or null
   */
  from(value: string | null): number | null {
    return value === null ? null : parseFloat(value);
  }
}
