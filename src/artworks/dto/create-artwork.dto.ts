import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class CreateArtworkDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1000)
  creationYear!: number;

  @IsString()
  technique!: string;

  @IsString()
  dimensions!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  reservePrice!: number;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsDateString()
  depositDate?: string;

  @IsInt()
  artistId!: number;
}
