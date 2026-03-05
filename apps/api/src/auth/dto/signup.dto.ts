import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    example: 'test@user.de',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'test12345',
    minLength: 8,
    description: 'At least 8 characters',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: 'Julia',
    minLength: 2,
    maxLength: 50,
    description:
      'Public display name (2–50 chars). Defaults to "Neighbor" if omitted.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName?: string;
}
