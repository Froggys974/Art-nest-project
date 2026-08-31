import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Roles(UserRole.COLLECTOR)
  @Post()
  @ApiOperation({
    summary: 'Purchase an artwork (collector only)',
    description:
      'Transactional sale with pessimistic locking. ' +
      'salePrice must be >= reservePrice. ' +
      'Commission: 40% (<= 5000 EUR), 35% (5001-20000 EUR), 30% (> 20000 EUR).',
  })
  @ApiResponse({
    status: 201,
    description: 'Sale recorded, artwork marked as sold',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — collector role required',
  })
  @ApiResponse({ status: 404, description: 'Artwork not found' })
  @ApiResponse({
    status: 422,
    description: 'Artwork not available or below reserve price',
  })
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: SafeUser) {
    return this.salesService.create(dto, user.userId);
  }
}
