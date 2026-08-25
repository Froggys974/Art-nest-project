import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateSaleDto {
  @IsInt()
  artworkId!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  salePrice!: number;
}
