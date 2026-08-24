import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from 'src/artists/artist.entity';
import { Artwork } from 'src/artworks/artwork.entity';
import { Sale } from 'src/sales/sale.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Artwork, Artist])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
