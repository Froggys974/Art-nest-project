import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class LinkArtistUserDto {
  @ApiProperty({
    example: 5,
    description: 'ID of the user account to link to this artist',
  })
  @IsInt()
  userId!: number;
}
