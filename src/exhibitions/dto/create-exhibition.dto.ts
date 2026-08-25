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
  @IsString()
  @MinLength(1)
  name!: string;
  @IsDateString()
  @Matches(DATE_ONLY, { message: `startDate ${DATE_ONLY_MESSAGE}` })
  startDate!: string;

  @IsDateString()
  @Matches(DATE_ONLY, { message: `endDate ${DATE_ONLY_MESSAGE}` })
  endDate!: string;

  @IsString()
  locationOrUrl!: string;

  @IsArray()
  @IsInt({ each: true })
  artworkIds!: number[];
}
