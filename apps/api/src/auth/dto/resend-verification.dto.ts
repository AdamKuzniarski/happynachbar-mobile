import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @IsEmail()
  @ApiProperty({
    example: 'julia@shark.de',
  })
  email: string;
}
