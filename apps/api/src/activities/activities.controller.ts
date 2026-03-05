import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ActivitiesService } from './activities.service';
import {
  ListActivitiesQueryDto,
  CreateActivityDto,
  UpdateActivityDto,
} from './dto/activities.input.dto';
import { ListActivitiesResponseDto } from './dto/list-activities.response.dto';
import { ActivityDetailDto } from './dto/activity.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  //Public feed
  @Get()
  @ApiQuery({ name: 'plz', required: false, example: '10115' })
  @ApiQuery({ name: 'q', required: false, example: 'coffee' })
  @ApiQuery({ name: 'take', required: false, example: 20 })
  @ApiQuery({
    name: 'cursor',
    required: false,
    example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc',
  })
  @ApiQuery({ name: 'category', required: false, example: 'OUTDOOR' })
  @ApiQuery({
    name: 'createdById',
    required: false,
    example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc',
  })
  @ApiQuery({
    name: 'startFrom',
    required: false,
    example: '2026-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'startTo',
    required: false,
    example: '2026-02-01T00:00:00.000Z',
  })
  @ApiOkResponse({ type: ListActivitiesResponseDto })
  async list(
    @Query() q: ListActivitiesQueryDto,
  ): Promise<ListActivitiesResponseDto> {
    return this.activities.list(q);
  }

  //Public detail
  @Get(':id')
  @ApiOkResponse({ type: ActivityDetailDto })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.activities.getById(id);
  }

  //Create auth
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Req() req: any, @Body() dto: CreateActivityDto) {
    return this.activities.create(req.user.userId, dto);
  }

  //Update auth + owner
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activities.update(req.user.userId, id, dto);
  }

  // Delete auth + owner → ARCHIVED
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  archive(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.activities.archive(req.user.userId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.activities.join(req.user.userId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/join')
  leave(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.activities.leave(req.user.userId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/joined')
  isJoined(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.activities.isJoined(req.user.userId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/participants')
  listParticipants(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.activities.listParticipants(req.user.userId, id);
  }
}
