import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateSaleDto {
  @ApiProperty({
    example: 3,
    description: 'ID of the artwork to purchase (must be available)',
  })
  @IsInt()
  artworkId!: number;

  @ApiProperty({
    example: 18000.0,
    description: 'Offered sale price in EUR. Must be >= reservePrice if set.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  salePrice!: number;
}
