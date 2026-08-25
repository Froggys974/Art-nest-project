import { IsInt } from 'class-validator';

export class LinkArtistUserDto {
  @IsInt()
  userId!: number;
}
