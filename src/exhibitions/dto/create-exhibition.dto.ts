import {
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateExhibitionDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  locationOrUrl!: string;

  @IsArray()
  @IsInt({ each: true })
  artworkIds!: number[];
}
