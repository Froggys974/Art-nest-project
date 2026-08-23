import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ArtistStatus } from '../artist-status.enum';
import { CreateArtistDto } from './create-artist.dto';

export class UpdateArtistDto extends PartialType(CreateArtistDto) {
  @IsOptional()
  @IsEnum(ArtistStatus)
  status?: ArtistStatus;
}
