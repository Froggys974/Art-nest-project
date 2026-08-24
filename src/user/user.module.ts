import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminSeedService } from './admin-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, AdminSeedService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
