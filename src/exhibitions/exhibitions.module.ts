import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibition } from './exhibition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exhibition])],
  exports: [TypeOrmModule],
})
export class ExhibitionsModule {}
