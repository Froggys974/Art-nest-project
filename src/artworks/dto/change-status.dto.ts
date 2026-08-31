import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ArtworkStatus } from '../artwork-status.enum';

export class ChangeStatusDto {
  @ApiProperty({
    enum: ArtworkStatus,
    example: ArtworkStatus.ON_LOAN,
    description:
      'New status. Cannot be set to "sold" directly — use the sales endpoint.',
  })
  @IsEnum(ArtworkStatus)
  status!: ArtworkStatus;
}
