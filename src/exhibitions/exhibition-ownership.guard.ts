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
import { Exhibition } from './exhibition.entity';

@Injectable()
export class ExhibitionOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Exhibition)
    private readonly exhibitionRepository: Repository<Exhibition>,
  ) {}

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

    const exhibition = await this.exhibitionRepository.findOneBy({
      id: Number(request.params.id),
    });
    if (!exhibition) {
      throw new NotFoundException('Exhibition not found');
    }
    if (exhibition.galleryId !== user.userId) {
      throw new ForbiddenException('Exhibition belongs to another gallery');
    }
    return true;
  }
}
