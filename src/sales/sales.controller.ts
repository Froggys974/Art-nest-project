import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Roles(UserRole.COLLECTOR)
  @Post()
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: SafeUser) {
    return this.salesService.create(dto, user.userId);
  }
}
