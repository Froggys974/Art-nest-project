import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artwork } from './artwork.entity';
import { ArtworkStatusHistory } from './artwork-status-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Artwork, ArtworkStatusHistory])],
  exports: [TypeOrmModule],
})
export class ArtworksModule {}
