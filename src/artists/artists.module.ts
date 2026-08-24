import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { Artwork } from 'src/artworks/artwork.entity';
import { Artist } from './artist.entity';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

@Module({
  imports: [TypeOrmModule.forFeature([Artist, Artwork]), UserModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
  exports: [TypeOrmModule],
})
export class ArtistsModule {}
