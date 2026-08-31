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

  /**
   * Finds a single user by the given criteria.
   * @param where - The search criteria
   * @returns The user entity if found, null otherwise
   */
  async findOneBy(where: FindOptionsWhere<User>): Promise<User | null> {
    return this.userRepository.findOneBy(where);
  }

  /**
   * Finds all users matching the given criteria.
   * @param where - The search criteria
   * @returns Array of user entities
   */
  async findBy(where: FindOptionsWhere<User>): Promise<User[]> {
    return this.userRepository.findBy(where);
  }

  /**
   * Creates a new user with hashed password. Gallery users start unvalidated.
   * @param username - The username
   * @param password - The plain text password (will be hashed)
   * @param role - The user role
   * @returns The created user entity
   */
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

  /**
   * Sets or clears the refresh token hash for a user.
   * @param userId - The user ID
   * @param refreshTokenHash - The hashed refresh token, or null to clear
   */
  async setRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userRepository.update({ userId }, { refreshTokenHash });
  }

  /**
   * Validates a gallery user account, allowing them to log in.
   * @param userId - The user ID to validate
   * @returns Safe user object without sensitive fields
   * @throws {NotFoundException} If user not found
   */
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
