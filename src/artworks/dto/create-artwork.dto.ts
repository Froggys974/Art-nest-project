import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Les Nymphéas' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'Grande peinture à lhuile sur toile.' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 1906, minimum: 1000 })
  @IsInt()
  @Min(1000)
  creationYear!: number;

  @ApiProperty({ example: 'Huile sur toile' })
  @IsString()
  technique!: string;

  @ApiProperty({ example: '200x150 cm' })
  @IsString()
  dimensions!: string;

  @ApiProperty({ example: 15000.0, description: 'Asking price in EUR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @ApiProperty({
    example: 12000.0,
    description: 'Minimum acceptable sale price in EUR',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  reservePrice!: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/nympheas.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '2024-03-01', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  depositDate?: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the artist who created this artwork',
  })
  @IsInt()
  artistId!: number;
}
