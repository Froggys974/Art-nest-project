import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateArtistDto {
  @ApiProperty({ example: 'Tom' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Hardy' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Peintre en bâtiment' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({ example: 'https://venom.com' })
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @ApiProperty({ example: 'Américain' })
  @IsString()
  nationality!: string;

  @ApiPropertyOptional({ example: '2026-08-15', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  entryDate?: string;
}
