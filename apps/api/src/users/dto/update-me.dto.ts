import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateMeDto {
  @IsOptional()
  @Transform(trim)
  @Matches(/^\d{5}$/, { message: 'plz must be exactly 5 digits' })
  @ApiPropertyOptional({
    example: '63073',
    description: 'German postal code (PLZ)',
    pattern: '^\\d{5}$',
  })
  plz?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 50)
  @ApiPropertyOptional({ example: 'Julia', minLength: 2, maxLength: 50 })
  displayName?: string;

  @IsOptional()
  @Transform(trim)
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar/abc.jpg' })
  avatarUrl?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  @ApiPropertyOptional({ example: 'Hi, I am your neighbor', maxLength: 300 })
  bio?: string;
}
