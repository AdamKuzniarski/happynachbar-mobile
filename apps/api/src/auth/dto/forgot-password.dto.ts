import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'julia@happynachbar.de' })
  @IsEmail()
  email!: string;
}
