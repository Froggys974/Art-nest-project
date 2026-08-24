import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { Artist } from './artist.entity';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

@Module({
  imports: [TypeOrmModule.forFeature([Artist]), UserModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
  exports: [TypeOrmModule],
})
export class ArtistsModule {}
