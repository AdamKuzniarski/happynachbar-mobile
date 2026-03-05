import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'b4fd... (token from reset link)',
    description: 'Raw reset token from the password reset email link',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    example: 'newpassword1234',
    minLength: 8,
    description: 'At least 8 characters',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
