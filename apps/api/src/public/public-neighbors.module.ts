import { Module } from '@nestjs/common';
import { PublicNeighborsController } from './public-neighbors.controller';
import { PublicUsersController } from './public-users.controller';

@Module({
  controllers: [PublicNeighborsController, PublicUsersController],
})
export class PublicNeighborsModule {}
