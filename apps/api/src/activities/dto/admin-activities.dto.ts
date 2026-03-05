import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  Matches,
  IsISO8601,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActivityStatus } from '@prisma/client';
import { ActivityCategory } from './activity-category.enum';

export class AdminListActivitiesQueryDto {
  @ApiPropertyOptional({ example: 'walk' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: '63073' })
  @IsOptional()
  @Matches(/^\d{5}$/)
  plz?: string;

  @ApiPropertyOptional({
    enum: ActivityCategory,
    example: ActivityCategory.OUTDOOR,
  })
  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @ApiPropertyOptional({ enum: ActivityStatus, example: ActivityStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  createdById?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}

export class AdminSetActivityStatusDto {
  @IsEnum(ActivityStatus)
  status!: ActivityStatus;
}

export class AdminBulkActivityStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsEnum(ActivityStatus)
  status!: ActivityStatus;
}
export class AdminUpdateActivityDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @IsOptional()
  @Matches(/^\d{5}$/)
  plz?: string;

  // Optional: allow rescheduling
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}
