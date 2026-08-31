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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Artworks')
@ApiBearerAuth()
@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) {}

  @Roles(UserRole.GALLERY)
  @Post()
  @ApiOperation({
    summary: 'Create an artwork (gallery only — max 50 active per artist)',
  })
  @ApiResponse({ status: 201, description: 'Artwork created' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — gallery role required',
  })
  @ApiResponse({
    status: 422,
    description: 'Artist already has 50 active artworks',
  })
  create(
    @Body(ArtworkLimitPipe) dto: CreateArtworkDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artworksService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all artworks (optional filters)' })
  @ApiQuery({ name: 'status', enum: ArtworkStatus, required: false })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false, example: 20000 })
  @ApiResponse({ status: 200, description: 'List of artworks' })
  findAll(
    @Query('status', new ParseEnumPipe(ArtworkStatus, { optional: true }))
    status?: ArtworkStatus,
    @Query('maxPrice', ParsePricePipe) maxPrice?: number | string,
  ) {
    return this.artworksService.findAll(status, maxPrice as number | undefined);
  }

  @Roles(UserRole.ARTIST)
  @Get('me')
  @ApiOperation({
    summary: 'List artworks belonging to the current artist account',
  })
  @ApiQuery({ name: 'status', enum: ArtworkStatus, required: false })
  @ApiQuery({ name: 'maxPrice', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'List of artworks' })
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
  @ApiOperation({ summary: 'Get one artwork by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artwork found' })
  @ApiResponse({ status: 404, description: 'Artwork not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.artworksService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get the status change history of an artwork' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Status history entries, chronological',
  })
  @ApiResponse({ status: 404, description: 'Artwork not found' })
  history(@Param('id', ParseIntPipe) id: number) {
    return this.artworksService.history(id);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @UseGuards(OwnershipGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update artwork details (gallery owner or admin)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Artwork updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your gallery' })
  @ApiResponse({ status: 404, description: 'Artwork not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArtworkDto) {
    return this.artworksService.update(id, dto);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @UseGuards(OwnershipGuard)
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change artwork status (gallery owner or admin)',
    description:
      'Cannot set status to "sold" directly — use POST /sales instead.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({
    status: 400,
    description: 'Cannot set status to sold via this endpoint',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — not your gallery' })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.artworksService.changeStatus(id, dto.status, user.userId);
  }
}
