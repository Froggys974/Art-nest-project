import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = 'must be a date-only string in YYYY-MM-DD format';

export class CreateExhibitionDto {
  @ApiProperty({ example: 'Exposition Printemps 2025' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({
    example: '2025-04-01',
    description: 'YYYY-MM-DD — start date (inclusive)',
  })
  @IsDateString()
  @Matches(DATE_ONLY, { message: `startDate ${DATE_ONLY_MESSAGE}` })
  startDate!: string;

  @ApiProperty({
    example: '2025-06-30',
    description: 'YYYY-MM-DD — end date (must be after startDate)',
  })
  @IsDateString()
  @Matches(DATE_ONLY, { message: `endDate ${DATE_ONLY_MESSAGE}` })
  endDate!: string;

  @ApiProperty({ example: 'Galerie Nationale du Jeu de Paume, Paris' })
  @IsString()
  locationOrUrl!: string;

  @ApiProperty({
    example: [1, 2, 5],
    description:
      'IDs of artworks to loan (must be available and owned by your gallery)',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  artworkIds!: number[];
}
