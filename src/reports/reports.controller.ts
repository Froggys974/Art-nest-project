import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRole.ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Platform-wide sales summary (admin only)' })
  @ApiResponse({
    status: 200,
    description:
      'Total sales, revenue, commission across all galleries and artists',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  adminSummary() {
    return this.reportsService.adminSummary();
  }

  @Roles(UserRole.GALLERY)
  @Get('gallery')
  @ApiOperation({ summary: 'Sales report for the current gallery' })
  @ApiResponse({
    status: 200,
    description: 'Gallery artworks, sales, exhibitions, and artist stats',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — gallery role required',
  })
  gallerySales(@CurrentUser() user: SafeUser) {
    return this.reportsService.gallerySales(user.userId);
  }

  @Roles(UserRole.ARTIST)
  @Get('artists/me')
  @ApiOperation({
    summary: 'Revenue report for the current artist (requires linked account)',
  })
  @ApiResponse({ status: 200, description: 'Own artworks and sales' })
  @ApiResponse({ status: 403, description: 'Forbidden — artist role required' })
  @ApiResponse({
    status: 404,
    description: 'No artist profile linked to this account',
  })
  myRevenue(@CurrentUser() user: SafeUser) {
    return this.reportsService.myRevenue(user.userId);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @Get('artists/:id')
  @ApiOperation({
    summary: 'Revenue report for a specific artist (gallery or admin)',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artist artworks and sales' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — gallery or admin role required',
  })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  artistRevenue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SafeUser,
  ) {
    return this.reportsService.artistRevenue(id, user);
  }
}
