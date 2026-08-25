import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtworksModule } from 'src/artworks/artworks.module';
import { Artwork } from 'src/artworks/artwork.entity';
import { ArtworkStatusHistory } from 'src/artworks/artwork-status-history.entity';
import { Exhibition } from './exhibition.entity';
import { ExhibitionsController } from './exhibitions.controller';
import { ExhibitionsService } from './exhibitions.service';
import { ExhibitionOwnershipGuard } from './exhibition-ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exhibition, Artwork, ArtworkStatusHistory]),
    ArtworksModule,
  ],
  controllers: [ExhibitionsController],
  providers: [ExhibitionsService, ExhibitionOwnershipGuard],
  exports: [TypeOrmModule],
})
export class ExhibitionsModule {}
