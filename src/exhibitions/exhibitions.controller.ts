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
import { ExhibitionsService } from './exhibitions.service';
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { ExhibitionOwnershipGuard } from './exhibition-ownership.guard';

@ApiTags('Exhibitions')
@ApiBearerAuth()
@Controller('exhibitions')
export class ExhibitionsController {
  constructor(private readonly exhibitionsService: ExhibitionsService) {}

  @Roles(UserRole.GALLERY)
  @Post()
  @ApiOperation({
    summary: 'Create an exhibition and loan artworks (gallery only)',
    description:
      'All listed artworks must be available and owned by your gallery. They become ON_LOAN until the exhibition ends.',
  })
  @ApiResponse({
    status: 201,
    description: 'Exhibition created, artworks set to on_loan',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden or artwork not owned by gallery',
  })
  @ApiResponse({
    status: 422,
    description: 'One or more artworks are not available',
  })
  create(@Body() dto: CreateExhibitionDto, @CurrentUser() user: SafeUser) {
    return this.exhibitionsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all exhibitions' })
  @ApiResponse({ status: 200, description: 'List of exhibitions' })
  findAll() {
    return this.exhibitionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one exhibition by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Exhibition found' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exhibitionsService.findOne(id);
  }

  @Roles(UserRole.GALLERY, UserRole.ADMIN)
  @UseGuards(ExhibitionOwnershipGuard)
  @Patch(':id/end')
  @ApiOperation({
    summary: 'End an exhibition (gallery owner or admin)',
    description: 'Returns all loaned artworks to available status.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Exhibition ended, artworks returned to available',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — not your exhibition' })
  @ApiResponse({ status: 404, description: 'Exhibition not found' })
  end(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SafeUser) {
    return this.exhibitionsService.end(id, user.userId);
  }
}
