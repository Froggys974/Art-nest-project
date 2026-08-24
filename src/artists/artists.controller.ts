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
import { LinkArtistUserDto } from './dto/link-artist-user.dto';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Roles(UserRole.GALLERY)
  @Post()
  create(@Body() dto: CreateArtistDto, @CurrentUser() user: SafeUser) {
    return this.artistsService.create(dto, user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.GALLERY)
  @Get()
  findAll(@CurrentUser() user: SafeUser) {
    return this.artistsService.findAll(user);
  }

  @Roles(UserRole.ARTIST)
  @Get('me')
  me(@CurrentUser() user: SafeUser) {
    return this.artistsService.findByUserId(user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.GALLERY)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artistsService.findOne(id, user);
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

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @Patch(':id/link-user')
  linkUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkArtistUserDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artistsService.linkUser(id, dto, user);
  }
}
