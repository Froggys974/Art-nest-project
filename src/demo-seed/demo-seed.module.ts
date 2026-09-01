import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ArtistsModule } from 'src/artists/artists.module';
import { ArtworksModule } from 'src/artworks/artworks.module';
import { DemoSeedService } from './demo-seed.service';

@Module({
  imports: [UserModule, ArtistsModule, ArtworksModule],
  providers: [DemoSeedService],
})
export class DemoSeedModule {}
