import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/user/user-role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'galerie_maeght', minLength: 3 })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'motdepasse123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    enum: [UserRole.GALLERY, UserRole.ARTIST, UserRole.COLLECTOR],
    example: UserRole.GALLERY,
    description: 'Admin accounts are seeded, not self-registered.',
  })
  @IsIn([UserRole.GALLERY, UserRole.ARTIST, UserRole.COLLECTOR])
  role!: UserRole;
}
