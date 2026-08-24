import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.ADMIN)
  @Get('admin')
  adminSummary() {
    return this.reportsService.adminSummary();
  }

  @Roles(UserRole.GALLERY)
  @Get('gallery')
  gallerySales(@CurrentUser() user: SafeUser) {
    return this.reportsService.gallerySales(user.userId);
  }

  @Roles(UserRole.ARTIST)
  @Get('artists/me')
  myRevenue(@CurrentUser() user: SafeUser) {
    return this.reportsService.myRevenue(user.userId);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @Get('artists/:id')
  artistRevenue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SafeUser,
  ) {
    return this.reportsService.artistRevenue(id, user);
  }
}
