import { IsIn, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/user/user-role.enum';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // Admin accounts are seeded, not self-registered.
  @IsIn([UserRole.GALLERY, UserRole.ARTIST, UserRole.COLLECTOR])
  role!: UserRole;
}
