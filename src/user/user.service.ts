import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private UserRepository: Repository<User>,
  ) {}

  async findOneBy(where: FindOptionsWhere<User>): Promise<User | null> {
    return this.UserRepository.findOneBy(where);
  }

  async findBy(where: FindOptionsWhere<User>): Promise<User[]> {
    return this.UserRepository.findBy(where);
  }

  async create(username: string, password: string): Promise<User> {
    const hash = await bcrypt.hash(password, 10);
    const user = this.UserRepository.create({ username, password: hash });
    return this.UserRepository.save(user);
  }
}
