import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { SafeUser } from './types/safe-user.type';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneBy(where: FindOptionsWhere<User>): Promise<User | null> {
    return this.userRepository.findOneBy(where);
  }

  async findBy(where: FindOptionsWhere<User>): Promise<User[]> {
    return this.userRepository.findBy(where);
  }

  async create(
    username: string,
    password: string,
    role: UserRole,
  ): Promise<User> {
    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      password: hash,
      role,
      isValidated: role !== UserRole.GALLERY,
    });
    return this.userRepository.save(user);
  }

  async setRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userRepository.update({ userId }, { refreshTokenHash });
  }

  async validate(userId: number): Promise<SafeUser> {
    const user = await this.userRepository.findOneBy({ userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isValidated = true;
    const { password, refreshTokenHash, ...safeUser } =
      await this.userRepository.save(user);
    return safeUser;
  }
}
