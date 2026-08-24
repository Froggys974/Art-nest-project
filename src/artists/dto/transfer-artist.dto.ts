import { IsInt } from 'class-validator';

export class TransferArtistDto {
  @IsInt()
  galleryId!: number;
}
