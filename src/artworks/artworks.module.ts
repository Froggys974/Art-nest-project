import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistsModule } from 'src/artists/artists.module';
import { Artwork } from './artwork.entity';
import { ArtworkStatusHistory } from './artwork-status-history.entity';
import { ArtworksController } from './artworks.controller';
import { ArtworksService } from './artworks.service';
import { ArtworkLimitPipe } from './artwork-limit.pipe';
import { OwnershipGuard } from './ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Artwork, ArtworkStatusHistory]),
    ArtistsModule,
  ],
  controllers: [ArtworksController],
  providers: [ArtworksService, ArtworkLimitPipe, OwnershipGuard],
  exports: [TypeOrmModule],
})
export class ArtworksModule {}
