import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './sale.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale])],
  exports: [TypeOrmModule],
})
export class SalesModule {}
