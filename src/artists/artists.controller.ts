import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { type SafeUser } from 'src/user/types/safe-user.type';
import { UserRole } from 'src/user/user-role.enum';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { TransferArtistDto } from './dto/transfer-artist.dto';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Roles(UserRole.GALLERY)
  @Post()
  create(@Body() dto: CreateArtistDto, @CurrentUser() user: SafeUser) {
    return this.artistsService.create(dto, user.userId);
  }

  @Get()
  findAll() {
    return this.artistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.artistsService.findOne(id);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArtistDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artistsService.update(id, dto, user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/transfer')
  transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferArtistDto,
  ) {
    return this.artistsService.transfer(id, dto.galleryId);
  }
}
