import { Module } from '@nestjs/common';
import { NeighborsController } from './neighbors.controller';

@Module({
  controllers: [NeighborsController],
})
export class NeighborsModule {}
