import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './user-role.enum';
import { UserService } from './user.service';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const username = this.config.getOrThrow<string>('ADMIN_USERNAME');
    const existing = await this.userService.findOneBy({ username });
    if (existing) {
      return;
    }
    await this.userService.create(
      username,
      this.config.getOrThrow<string>('ADMIN_PASSWORD'),
      UserRole.ADMIN,
    );
    this.logger.log(`Admin user '${username}' created`);
  }
}
