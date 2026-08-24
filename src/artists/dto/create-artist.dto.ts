import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateArtistDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @IsString()
  nationality!: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;
}
