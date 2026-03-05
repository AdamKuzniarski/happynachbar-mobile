import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    example: 'julia@shark.de',
  })
  email: string;

  @IsString()
  @ApiProperty({ example: 'test12345' })
  password: string;
}
