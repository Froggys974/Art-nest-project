import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
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
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { TransferArtistDto } from './dto/transfer-artist.dto';
import { LinkArtistUserDto } from './dto/link-artist-user.dto';

@ApiTags('Artists')
@ApiBearerAuth()
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Roles(UserRole.GALLERY)
  @Post()
  @ApiOperation({ summary: 'Create an artist (gallery only)' })
  @ApiResponse({ status: 201, description: 'Artist created' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — gallery role required',
  })
  create(@Body() dto: CreateArtistDto, @CurrentUser() user: SafeUser) {
    return this.artistsService.create(dto, user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.GALLERY)
  @Get()
  @ApiOperation({
    summary: 'List artists (gallery sees only their own, admin sees all)',
  })
  @ApiResponse({ status: 200, description: 'List of artists' })
  findAll(@CurrentUser() user: SafeUser) {
    return this.artistsService.findAll(user);
  }

  @Roles(UserRole.ARTIST)
  @Get('me')
  @ApiOperation({
    summary: 'Get the artist profile linked to the current user account',
  })
  @ApiResponse({ status: 200, description: 'Artist profile' })
  @ApiResponse({ status: 404, description: 'No artist linked to this account' })
  me(@CurrentUser() user: SafeUser) {
    return this.artistsService.findByUserId(user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.GALLERY)
  @Get(':id')
  @ApiOperation({ summary: 'Get one artist by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artist found' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artistsService.findOne(id, user);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an artist' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artist updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your gallery' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArtistDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artistsService.update(id, dto, user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/transfer')
  @ApiOperation({
    summary: 'Transfer an artist to another gallery (admin only)',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Artist transferred — all non-sold artworks also moved',
  })
  @ApiResponse({ status: 400, description: 'Target is not a gallery user' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferArtistDto,
  ) {
    return this.artistsService.transfer(id, dto.galleryId);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @Patch(':id/link-user')
  @ApiOperation({ summary: 'Link an artist profile to a user account' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artist linked to user account' })
  @ApiResponse({ status: 404, description: 'Artist or user not found' })
  linkUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkArtistUserDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artistsService.linkUser(id, dto, user);
  }
}
