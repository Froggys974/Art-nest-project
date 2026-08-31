import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class TransferArtistDto {
  @ApiProperty({ example: 3, description: 'ID of the target gallery user' })
  @IsInt()
  galleryId!: number;
}
