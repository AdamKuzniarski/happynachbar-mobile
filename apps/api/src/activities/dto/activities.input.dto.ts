// Input DTO

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ActivityCategory } from './activity-category.enum';

export class CreateActivityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(ActivityCategory)
  category!: ActivityCategory;

  // führende Nullen erlaubt
  @Matches(/^\d{5}$/)
  plz!: string;

  // ISO datetime
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  imageUrls?: string[];
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}

//------------------------------------------------------------------------------------------------------------
//Query DTO
export class ListActivitiesQueryDto {
  @ApiPropertyOptional({ example: '63073' })
  @IsOptional()
  @Matches(/^\d{1,5}$/)
  plz?: string;

  @ApiPropertyOptional({ example: 'walk' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;

  @ApiPropertyOptional({
    example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    enum: ActivityCategory,
    example: ActivityCategory.OUTDOOR,
  })
  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @ApiPropertyOptional({
    example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  createdById?: string;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startFrom?: string;

  @ApiPropertyOptional({
    example: '2026-02-01T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startTo?: string;
}
