import { IsEnum } from 'class-validator';
import { ArtworkStatus } from '../artwork-status.enum';

export class ChangeStatusDto {
  @IsEnum(ArtworkStatus)
  status!: ArtworkStatus;
}
