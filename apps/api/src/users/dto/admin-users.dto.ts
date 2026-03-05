import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class AdminListUsersQueryDto {
  @ApiPropertyOptional({ example: 'julia@happynachbar.de' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === true || value === false) return value;
    if (typeof value !== 'string') return undefined;
    const v = value.trim().toLowerCase();
    if (v === 'true') return true;
    if (v === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isBanned?: boolean;

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

export class AdminSetUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

export class AdminSetUserBanDto {
  @Transform(({ value }: { value: unknown }) => {
    if (value === true || value === false) return value;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return value;
  })
  @IsBoolean()
  isBanned!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
