import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { ExhibitionsService } from './exhibitions.service';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { ExhibitionOwnershipGuard } from './exhibition-ownership.guard';

@Controller('exhibitions')
export class ExhibitionsController {
  constructor(private readonly exhibitionsService: ExhibitionsService) {}

  @Roles(UserRole.GALLERY)
  @Post()
  create(@Body() dto: CreateExhibitionDto, @CurrentUser() user: SafeUser) {
    return this.exhibitionsService.create(dto, user.userId);
  }

  @Get()
  findAll() {
    return this.exhibitionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exhibitionsService.findOne(id);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @UseGuards(ExhibitionOwnershipGuard)
  @Patch(':id/end')
  end(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SafeUser) {
    return this.exhibitionsService.end(id, user.userId);
  }
}
