import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { Artwork } from './artwork.entity';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
  ) {}

  /**
   * Checks if the user has permission to access an artwork (admin or owning gallery).
   * @param context - The execution context
   * @returns True if user is authorized, false otherwise
   * @throws {NotFoundException} If artwork not found
   * @throws {ForbiddenException} If artwork belongs to another gallery
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: SafeUser }>();
    const user = request.user;
    if (!user) {
      return false;
    }
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const artwork = await this.artworkRepository.findOneBy({
      id: Number(request.params.id),
    });
    if (!artwork) {
      throw new NotFoundException('Artwork not found');
    }
    if (artwork.galleryId !== user.userId) {
      throw new ForbiddenException('Artwork belongs to another gallery');
    }
    return true;
  }
}
