import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { ParsePricePipe } from 'src/common/pipes/parse-price.pipe';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { ArtworkLimitPipe } from './artwork-limit.pipe';
import { ArtworkStatus } from './artwork-status.enum';
import { ArtworksService } from './artworks.service';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { OwnershipGuard } from './ownership.guard';

@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) {}

  @Roles(UserRole.GALLERY)
  @Post()
  create(
    @Body(ArtworkLimitPipe) dto: CreateArtworkDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artworksService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @Query('status', new ParseEnumPipe(ArtworkStatus, { optional: true }))
    status?: ArtworkStatus,
    @Query('maxPrice', ParsePricePipe) maxPrice?: number | string,
  ) {
    return this.artworksService.findAll(status, maxPrice as number | undefined);
  }

  @Roles(UserRole.ARTIST)
  @Get('me')
  findMine(
    @CurrentUser() user: SafeUser,
    @Query('status', new ParseEnumPipe(ArtworkStatus, { optional: true }))
    status?: ArtworkStatus,
    @Query('maxPrice', ParsePricePipe) maxPrice?: number | string,
  ) {
    return this.artworksService.findMine(
      user.userId,
      status,
      maxPrice as number | undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.artworksService.findOne(id);
  }

  @Get(':id/history')
  history(@Param('id', ParseIntPipe) id: number) {
    return this.artworksService.history(id);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @UseGuards(OwnershipGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArtworkDto) {
    return this.artworksService.update(id, dto);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @UseGuards(OwnershipGuard)
  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artworksService.changeStatus(id, dto.status, user.userId);
  }
}
