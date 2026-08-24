import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtworksModule } from 'src/artworks/artworks.module';
import { Artwork } from 'src/artworks/artwork.entity';
import { Exhibition } from './exhibition.entity';
import { ExhibitionsController } from './exhibitions.controller';
import { ExhibitionsService } from './exhibitions.service';
import { ExhibitionOwnershipGuard } from './exhibition-ownership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Exhibition, Artwork]), ArtworksModule],
  controllers: [ExhibitionsController],
  providers: [ExhibitionsService, ExhibitionOwnershipGuard],
  exports: [TypeOrmModule],
})
export class ExhibitionsModule {}
